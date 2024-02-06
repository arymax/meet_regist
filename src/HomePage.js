import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // 導入 useParams 鉤子
import './App.css';

const HomePage = () => {
    const [name, setName] = useState('');
    const [checkinMessage, setCheckinMessage] = useState('');
    const navigate = useNavigate();
    const { code } = useParams(); // 使用 useParams 鉤子獲取路由參數

    useEffect(() => {
        const checkMeetingCode = async () => {
            try {
                const response = await fetch(`http://meetregist.ddns.net:8080/api-list/checkin/${code}`);
                if (!response.ok) {
                    throw new Error('會議代碼無效');
                }
                const text = await response.text();
                const data = text ? JSON.parse(text) : {};
                console.log(data.message);  // 會議代碼有效
            } catch (error) {
                console.error('Error:', error);
                navigate('/');  // 代碼無效時導航回首頁或其他頁面
            }
        };

        checkMeetingCode();
    }, [code, navigate]);

    const handleCheckIn = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://meetregist.ddns.net:8080/api-list/checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ meetingCode: code, participantName: name }),
            });

            if (!response.ok) {
                throw new Error('簽到失敗');
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};
            console.log(data.message);

            const checkinTime = data.checkinTime;  // 從後端響應中獲取簽到時間
            setCheckinMessage(`${name}貴賓您好，感謝您的到來！ 簽到時間：${checkinTime.split('T')[0]}`);
        } catch (error) {
            console.error('Error:', error);
            setCheckinMessage('簽到失敗，請重試。');
        }
    };

    return (
        <div className="pageContainer homePage">
            <h1>歡迎來到會議簽到系統</h1>
            <form onSubmit={handleCheckIn} className="homeForm">
                <div className="inputGroup">
                    <label>請輸入您的姓名：</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="textInput"
                    />
                </div>
                <button type="submit" className="submitButton">簽到</button>
            </form>
            {checkinMessage && <p className="checkinMessage">{checkinMessage}</p>}
        </div>
    );
};

export default HomePage;
