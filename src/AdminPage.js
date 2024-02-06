import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import './App.css';
const AdminPage = () => {
    // 定義狀態
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');;
    const [qrCodeData, setQrCodeData] = useState(''); // 新增 QRCode 數據狀態
    const [meetings, setMeetings] = useState([]);
    const [selectedCheckins, setSelectedCheckins] = useState([]);
    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const response = await fetch('http://meetregist.ddns.net:8080/api-list/meetings');
                if (!response.ok) {
                    throw new Error('Failed to fetch meetings');
                }
                const text = await response.text();  // 先获取文本内容
                const data = text ? JSON.parse(text) : [];  // 仅当文本非空时尝试解析 JSON
                setMeetings(data);  // 更新狀態以存儲會議列表
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchMeetings();
    }, []);
    const fetchCheckins = async (meetingCode) => {
        try {
            const response = await fetch(`http://meetregist.ddns.net:8080/api-list/checkins/${meetingCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch checkins');
            }
            const data = await response.json();
            setSelectedCheckins(data); // 更新状态以存储签到记录
        } catch (error) {
            console.error('Error:', error);
        }
    };
    // 處理提交會議資訊
    const handleSubmit = async (e) => {
        e.preventDefault();
        const meetingInfo = { startTime, endTime };

        try {
            const response = await fetch('http://meetregist.ddns.net:8080/api-list/meeting-regist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(meetingInfo)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};
            console.log(data);

            setQrCodeData(data.meetingLink);  // 使用從後端返回的會議連結生成 QR 碼
        } catch (error) {
            console.error('Error:', error);
        }
    };
    // 處理檔案上傳
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        console.log(file); // 這裡可以將文件發送到後端進行解析
    };

    return (
        <div className="pageContainer adminPage">
            <h1>會議管理</h1>
            <form onSubmit={handleSubmit}>
                <input type="datetime-local" onChange={e => setStartTime(e.target.value)} />
                <input type="datetime-local" onChange={e => setEndTime(e.target.value)} />
                <button type="submit">生成QR code</button>
            </form>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            {qrCodeData && <QRCode value={qrCodeData} />} {/* 条件渲染 QRCode */}

            {/* 在这里渲染会议列表 */}
            <div className="meetingsList">
                <h2>已創建的會議</h2>
                {meetings.map(meeting => (
                <div key={meeting.id} className="meetingItem">
                    <span>會議代碼：{meeting.meetingCode}</span>
                    <span>開始時間：{meeting.startTime}</span>
                    <span>結束時間：{meeting.endTime}</span>
                    <QRCode value={meeting.meetingLink} size={128} level={"H"} />
                    <button onClick={() => fetchCheckins(meeting.meetingCode)}>查看簽到</button>
                </div>
            ))}
            <div className="checkinsList">
            {selectedCheckins.map((checkin, index) => (
        <div key={index} className="checkinItem">
            <span>姓名：{checkin.participantName}</span>
            <span>簽到時間：{checkin.checkinTime}</span>
        </div>
    ))}
</div>
            </div>
        </div>
    );
};

export default AdminPage;