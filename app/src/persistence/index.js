const waitPort = require('wait-port');
const fs = require('fs');
const mysql = require('mysql');

const {
    MYSQL_HOST: HOST,
    MYSQL_HOST_FILE: HOST_FILE,
    MYSQL_USER: USER,
    MYSQL_USER_FILE: USER_FILE,
    MYSQL_PASSWORD: PASSWORD,
    MYSQL_PASSWORD_FILE: PASSWORD_FILE,
    MYSQL_DB: DB,
    MYSQL_DB_FILE: DB_FILE,
} = process.env;

let pool;

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE) : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE) : USER;
    const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE) : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE) : DB;

    await waitPort({ host, port : 3306, timeout: 15000 });

    pool = mysql.createPool({
        connectionLimit: 5,
        host,
        user,
        password,
        database,
        charset: 'utf8mb4',
    });

    // return dropTables().then(() => createTables()); // for use during development only
    return createTables();
}

function createTables() {
    const spotifyIdLength = 32;
    const nameLength = 255;
    const tokenLength = 255;
    const uuidLength = 36;
    const urlLength = 255;

    const CREATE_USER = `CREATE TABLE IF NOT EXISTS user (
        id VARCHAR(${uuidLength}) NOT NULL PRIMARY KEY,
        username VARCHAR(${nameLength}) NOT NULL,
        password VARCHAR(${nameLength}) NOT NULL
    );`;
    const CREATE_TOKEN = `CREATE TABLE IF NOT EXISTS token (
        accessToken VARCHAR(${tokenLength}) NOT NULL PRIMARY KEY,
        userID VARCHAR(${uuidLength}) NOT NULL,
        expiration DATETIME DEFAULT NULL,
        refreshToken VARCHAR(${tokenLength}) DEFAULT NULL,
        FOREIGN KEY (userID) REFERENCES user(id) ON DELETE CASCADE
    );`;
    const CREATE_PLAYLIST = `CREATE TABLE IF NOT EXISTS playlist (
        playlistID VARCHAR(${spotifyIdLength}) NOT NULL,
        name VARCHAR(${nameLength}) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Unknown',
        numSongs INT DEFAULT NULL,
        pictureURL VARCHAR(${urlLength}) DEFAULT NULL,
        PRIMARY KEY (playlistID)
    );`;
    const CREATE_TRACK = `CREATE TABLE IF NOT EXISTS track (
        trackID VARCHAR(${spotifyIdLength}) NOT NULL PRIMARY KEY,
        trackName VARCHAR(${nameLength}) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unknown',
        artistName VARCHAR(${nameLength}) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Unknown',
        albumName VARCHAR(${nameLength}) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Unknown',
        lengthMS INT DEFAULT NULL,
        danceability FLOAT DEFAULT NULL,
        acousticness FLOAT DEFAULT NULL,
        energy FLOAT DEFAULT NULL,
        loudness FLOAT DEFAULT NULL,
        mode FLOAT DEFAULT NULL,
        tempo FLOAT DEFAULT NULL,
        valence FLOAT DEFAULT NULL
    );`;
    const CREATE_USER_LIBRARY = `CREATE TABLE IF NOT EXISTS userLibrary (
        userID VARCHAR(${uuidLength}) NOT NULL,
        trackID VARCHAR(${spotifyIdLength}) NOT NULL,
        playlistID VARCHAR(${spotifyIdLength}) NOT NULL,
        PRIMARY KEY (userID, trackID, playlistID),
        FOREIGN KEY (userID) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (trackID) REFERENCES track(trackID) ON DELETE CASCADE,
        FOREIGN KEY (playlistID) REFERENCES playlist(playlistID) ON DELETE CASCADE
    )`

    return new Promise((acc, rej) => {
        executeStatement(CREATE_USER).then(() => {
            console.log('added user');
            return executeStatement(CREATE_TOKEN);
        }).then(() => {
            console.log('added token');
            return executeStatement(CREATE_PLAYLIST);
        }).then(() => {
            console.log('added playlist');
            return executeStatement(CREATE_TRACK);
        }).then(() => {
            console.log('added track');
            return executeStatement(CREATE_USER_LIBRARY);
        }).then(() => {
            console.log('added userLibrary');
            acc();
        }).catch((err) => {
            return rej(err);
        });
    });
}

function dropTables() {
    return new Promise((acc, rej) => { 
        executeStatement('DROP TABLE IF EXISTS token').then(() => {
            console.log('dropped token');
            return executeStatement('DROP TABLE IF EXISTS userLibrary');
        }).then(() => {
            console.log('dropped userLibrary');
            return executeStatement('DROP TABLE IF EXISTS track');
        }).then(() => {
            console.log('dropped track');
            return executeStatement('DROP TABLE IF EXISTS playlist');
        }).then(() => {
            console.log('dropped playlist');
            return executeStatement('DROP TABLE IF EXISTS user');
        }).then(() => {
            console.log('dropped user');
            acc();
        }).catch((err) => {
            return rej(err);
        })
    });
}

function executeStatement(statement, args = []) {
    return new Promise((acc, rej) => {
        pool.query(statement, args, (err) => {
            if (err) return rej(err);
            acc('worked');
        });
    });
}

async function teardown() {
    return new Promise((acc, rej) => {
        pool.end(err => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getUsers() {
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM user', (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.map(item =>
                    Object.assign({}, item),
                ),
            );
        });
    });
}

async function getPlaylists(userID) {
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM playlist WHERE userID = ?', [userID], (err, rows) => {
            if (err) return rej(err);
            acc(rows);
        })
    });
}

async function getToken(userID) {
    return new Promise((acc, rej) => {
        pool.query('SELECT accessToken FROM token WHERE userID = ?', [userID], (err, rows) => {
            if (err) return rej(err);
            acc(rows[0].accessToken);
        });
    });
}

async function storeUser(item) {
    return new Promise((acc, rej) => {
        pool.query(
            'INSERT INTO user (id, username, password) VALUES (?, ?, ?)',
            [item.id, item.username, item.password],
            err => {
                if (err) return rej(err);
                acc();
            }
       );
   });
}

async function storeToken(token) {
    return new Promise((acc, rej) => {
        pool.query(
            'INSERT INTO token (accessToken, userID, expiration, refreshToken) \
            VALUES (?, ?, STR_TO_DATE(?, "%a, %d %b %Y %H:%i:%s GMT"), ?)',
            [token.accessToken, token.userID, token.expirationUTC, token.refreshToken],
            (err) => {
                if (err) return rej('Error inserting token into db: ' + err);
                acc();
            }
        );
    });
}

async function storePlaylists(playlists) {
    let playlistPromises = [];
    for (const item of playlists) {
        playlistPromises.push(
            executeStatement('INSERT INTO playlist (playlistID, userID, name, numSongs, pictureURL) \
            VALUES (?, ?, ?, ?, ?)',
            [item.playlistID, item.userID, item.name, item.numSongs, item.pictureURL]
        ).catch((error) => {
            return Promise.reject(new Error('Error inserting playlist into database: ' + error));
        }));
    }

    return Promise.all(playlistPromises);
}

module.exports = {
    init,
    teardown,
    getUsers,
    getToken,
    getPlaylists,
    storeUser,
    storeToken,
    storePlaylists,
};
