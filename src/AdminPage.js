import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { Link } from 'react-router-dom';
import './App.css';

const AdminPage = () => {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [qrCodeData, setQrCodeData] = useState('');
    const [meetings, setMeetings] = useState([]);
    const [meetingCode, setMeetingCode] = useState('');

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const response = await fetch('http://meetregist.ddns.net:8080/api-list/meetings');
                if (!response.ok) {
                    throw new Error('Failed to fetch meetings');
                }
                const data = await response.json();
                setMeetings(data);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchMeetings();
    }, []);

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

            const data = await response.json();
            setQrCodeData(data.meetingLink);
            setMeetingCode(data.meetingCode); // 儲存 meetingCode 以供後續使用
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="pageContainer adminPage">
            <h1>會議管理</h1>
            <form onSubmit={handleSubmit}>
                <input type="datetime-local" onChange={e => setStartTime(e.target.value)} />
                <input type="datetime-local" onChange={e => setEndTime(e.target.value)} />
                <button type="submit">生成QR code</button>
            </form>
            {qrCodeData && <QRCode value={qrCodeData} />}
            <div className="meetingsList">
                <h2>已創建的會議</h2>
                {meetings.map((meeting, index) => (
                    <div key={index} className="meetingItem">
                        <span>會議代碼：{meeting.meetingCode}</span>
                        <span>開始時間：{meeting.startTime}</span>
                        <span>結束時間：{meeting.endTime}</span>
                        <QRCode value={meeting.meetingLink} size={128} level={"H"} />
                        <Link to={`/meeting-details/${meeting.meetingCode}`}>查看詳細信息</Link>
                        {/* 您可以在這裡添加一個按鈕或鏈接來導航到 MeetingDetails 頁面 */}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPage;