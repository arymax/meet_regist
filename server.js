const express = require('express');
const busboy = require('connect-busboy');
const fs = require('fs');
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const os = require('os');
const moment = require('moment-timezone');
const app = express();
const path = require('path');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(busboy());
// 獲取本機 IP 地址
function getLocalIPAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (const iface of Object.values(networkInterfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal && alias.address.startsWith('192.168')) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIPAddress();
console.log(`Local IP Address: ${localIP}`);


const db = new sqlite3.Database('./mydb.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // 創建會議表，並直接加入excelPath欄位
        db.run(`
            CREATE TABLE IF NOT EXISTS meetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                startTime TEXT,
                endTime TEXT,
                meetingCode TEXT UNIQUE,
                meetingLink TEXT,
                excelPath TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Error creating meetings table', err.message);
            }
        });
        // 創建簽到記錄表
        db.run(`
            CREATE TABLE IF NOT EXISTS checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meetingCode TEXT,
                participantName TEXT,
                checkinTime TEXT,
                FOREIGN KEY(meetingCode) REFERENCES meetings(meetingCode)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating checkins table', err.message);
            }
        });
    }
});


// 處理會議資訊提交
app.post('/api-list/meeting-regist', (req, res) => {
    console.log('Received meeting-regist request');
    const { startTime, endTime } = req.body;
    const meetingCode = Math.floor(1000 + Math.random() * 9000);
    const meetingLink = `http://meetregist.ddns.net:8080/checkin/${meetingCode}`;
    const sql = 'INSERT INTO meetings (startTime, endTime, meetingCode, meetingLink) VALUES (?, ?, ?, ?)';

    db.run(sql, [startTime, endTime, meetingCode, meetingLink], function(err) {
        if (err) {
            console.error('Error inserting into table', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: '會議創建成功', meetingLink });
    });
});
app.get('/api-list/meetings', (req, res) => {
    console.log('Received meetings request');
    const sql = 'SELECT * FROM meetings';
    console.log(sql);
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error querying the meetings table', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.json(rows);
    });
});
app.get('/api-list/meetings/:meetingCode', (req, res) => {
    const { meetingCode } = req.params; // 從 URL 參數中獲取 meetingCode

    const sql = 'SELECT * FROM meetings WHERE meetingCode = ?';
    db.get(sql, [meetingCode], (err, row) => {
        if (err) {
            console.error('Error querying the meetings table', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row); // 如果找到了會議，返回會議資訊
        } else {
            res.status(404).json({ message: '會議代碼未找到' }); // 如果未找到會議，返回 404 錯誤
        }
    });
});
app.post('/api-list/checkin', (req, res) => {
    const { meetingCode, participantName } = req.body;
    const checkinTime = moment().tz('Asia/Taipei').format();

    // 首先检查是否已经存在该用户的签到记录
    const checkExistSql = 'SELECT * FROM checkins WHERE meetingCode = ? AND participantName = ?';
    db.get(checkExistSql, [meetingCode, participantName], (err, row) => {
        if (err) {
            console.error('Error querying checkins table', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            // 如果存在，则更新签到时间
            const updateSql = 'UPDATE checkins SET checkinTime = ? WHERE meetingCode = ? AND participantName = ?';
            db.run(updateSql, [checkinTime, meetingCode, participantName], function(err) {
                if (err) {
                    console.error('Error updating checkin time', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: '签到时间更新成功', checkinTime: checkinTime });
            });
        } else {
            // 如果不存在，则插入新的签到记录
            const insertSql = 'INSERT INTO checkins (meetingCode, participantName, checkinTime) VALUES (?, ?, ?)';
            db.run(insertSql, [meetingCode, participantName, checkinTime], function(err) {
                if (err) {
                    console.error('Error inserting into checkins table', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: '签到成功', checkinTime: checkinTime });
            });
        }
    });
});
app.get('/api-list/checkin/:code', (req, res) => {
    const { code } = req.params;
    const sql = 'SELECT * FROM meetings WHERE meetingCode = ?';
    db.get(sql, [code], (err, row) => {
        if (err) {
            console.error('Error querying the table', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({ message: '會議代碼有效', code: row.meetingCode });
        } else {
            res.status(404).json({ message: '會議代碼無效' });
        }
    });
});
// 處理 Excel 檔案上傳
app.post('/api-list/upload', (req, res) => {
    req.busboy.on('file', (fieldname, file, fileObj) => {
        console.log(`Uploading: ${fileObj.filename}`);

        if (typeof fileObj.filename === 'string') {
            const saveTo = path.join(__dirname, './attender_list/', fileObj.filename);
            file.pipe(fs.createWriteStream(saveTo));
        } else {
            console.error('Filename is not a string:', fileObj.filename);
        }
    });

    req.busboy.on('finish', () => {
        console.log('Upload complete');
        // 修改這裡，將響應改為 JSON 格式
        res.json({ message: "File uploaded successfully" });
    });

    req.pipe(req.busboy);
});
app.get('/api-list/checkins/:meetingCode', (req, res) => {
    const { meetingCode } = req.params;

    const sql = 'SELECT participantName, checkinTime FROM checkins WHERE meetingCode = ?';

    db.all(sql, [meetingCode], (err, rows) => {
        if (err) {
            console.error('Error querying checkins table', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});
app.get('/api-list/attendees/:meetingCode', (req, res) => {
    const { meetingCode } = req.params;
    // 根據會議代碼構建 Excel 文件的路徑
    const excelPath = path.join(__dirname, './attender_list/', `${meetingCode}.xlsx`);

    // 檢查文件是否存在
    if (!fs.existsSync(excelPath)) {
        return res.status(404).json({ message: 'Excel file for this meeting code does not exist.' });
    }

    try {
        // 讀取 Excel 文件
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const attendees = XLSX.utils.sheet_to_json(worksheet);

        // 將 Excel 文件中的參與者信息發送到前端
        res.json(attendees);
    } catch (error) {
        console.error('Error reading the excel file', error);
        res.status(500).json({ error: 'Failed to read the attendees list from the Excel file.' });
    }
});
setInterval(() => {
    // 获取当前时间
    const now = new Date();
    // 计算两个月前的时间
    now.setMonth(now.getMonth() - 2);
    // 转换为 ISO 格式字符串
    const twoMonthsAgo = now.toISOString();

    // 删除两个月前结束的会议
    const deleteExpiredMeetingsSql = `DELETE FROM meetings WHERE endTime < ?`;
    db.run(deleteExpiredMeetingsSql, [twoMonthsAgo], function(err) {
        if (err) {
            console.error('Error deleting expired meetings', err.message);
        } else {
            console.log(`Deleted ${this.changes} expired meetings that ended before ${twoMonthsAgo}`);
        }
    });

    // 同时删除与已删除会议相关的签到记录
    const deleteExpiredCheckinsSql = `DELETE FROM checkins WHERE meetingCode NOT IN (SELECT meetingCode FROM meetings)`;
    db.run(deleteExpiredCheckinsSql, function(err) {
        if (err) {
            console.error('Error deleting orphaned checkins', err.message);
        } else {
            console.log(`Deleted ${this.changes} orphaned checkins`);
        }
    });
}, 86400000);
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://${localIP}:${PORT}`);
});