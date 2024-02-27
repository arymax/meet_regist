import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './App.css';

const MeetingDetails = () => {
  const { meetingCode } = useParams(); // 獲取會議代碼
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    // 獲取會議詳細信息
    const fetchMeetingDetails = async () => {
      try {
        const response = await fetch(`http://meetregist.ddns.net:8080/api-list/meetings/${meetingCode}`);
        if (!response.ok) {
          throw new Error('Failed to fetch meeting details');
        }
        const data = await response.json();
        setMeetingDetails(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    // 獲取參與者信息
    const fetchAttendees = async () => {

      try {
        const response = await fetch(`http://meetregist.ddns.net:8080/api-list/attendees/${meetingCode}`);
        console.log(response);
        if (!response.ok) {
          throw new Error('Failed to fetch attendees');
        }
        const rawData = await response.json();

    // 將原始數據轉換為前端需要的格式
    const formattedData = rawData.map(item => ({
      id: item['2024年春季進修會'] || item.id,
      unit: item.__EMPTY || item.unit,
      name: item.__EMPTY_1 || item.name,
      session: item.__EMPTY_2 || item.session,
      meal: item.__EMPTY_3 || item.meal,
      // 對於簽到狀態，可以保持為空，後續將根據 checkins 狀態進行判斷
    })).filter(item => item.id && item.name); // 過濾掉標題行或不完整的數據行

    setAttendees(formattedData);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    // 獲取簽到信息
    const fetchCheckins = async () => {
      try {
        const response = await fetch(`http://meetregist.ddns.net:8080/api-list/checkins/${meetingCode}`);
        if (!response.ok) {
          throw new Error('Failed to fetch checkins');
        }
        const data = await response.json();
        setCheckins(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchMeetingDetails();
    fetchCheckins();
    fetchAttendees();
  }, [meetingCode]);

  // 處理檔案上傳
  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // 保存選擇的檔案
  };

  const uploadFile = async () => {
    if (!file) return;
    console.log(meetingCode)
    const formData = new FormData();
    const fileExtension = file.name.split('.').pop();
    const newFilename = `${meetingCode}.${fileExtension}`;
    formData.append('file', file, newFilename);  // 使用新文件名


    try {
      const response = await fetch(`http://meetregist.ddns.net:8080/api-list/upload`, {
        method: 'POST',
        body: formData, // 发送包含文件和会议代码的 FormData
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="meetingDetailsPageContainer">
      <h2>會議詳細信息</h2>
      {meetingDetails && (
        <div>
          <p>會議代碼：{meetingDetails.meetingCode}</p>
          <p>開始時間：{meetingDetails.startTime}</p>
          <p>結束時間：{meetingDetails.endTime}</p>
        </div>
      )}
      <div className="fileInputContainer">
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <button onClick={uploadFile}>匯入參與者名單</button>
      </div>
      <h3>參與者名單</h3>
      <div className="meetingDetailsTableContainer">
    <table>
      <tbody>
        {attendees.map((attendee, index) => (
          <tr key={index}>
            <td>{attendee.id}</td>
            <td>{attendee.unit}</td>
            <td>{attendee.name}</td>
            <td>{attendee.session}</td>
            <td>{attendee.meal}</td>
            <td>{checkins.some(checkin => checkin.participantName === attendee.name) ? '✔' : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
    </div>
  );
};

export default MeetingDetails;
