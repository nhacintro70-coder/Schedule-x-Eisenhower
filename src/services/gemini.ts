import { Task, ScheduleData, DateInfo, RoutineSettings } from '../types';

export const callGeminiWithBackoff = async (payload: any, customApiKey: string): Promise<any> => {
  const activeKey = customApiKey.trim() || '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${activeKey}`;
  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (attempt === delays.length) throw err;
      await new Promise((res) => setTimeout(res, delays[attempt]));
    }
  }
};

export const createAiPromptPayload = (
  commandText: string,
  tasks: Task[],
  schedule: ScheduleData,
  dateInfo: DateInfo,
  userName: string = 'Bạn',
  routineSettings?: RoutineSettings
) => {
  const lunchTime = routineSettings?.lunchTime || '12:00 - 13:00';
  const dinnerTime = routineSettings?.dinnerTime || '18:30 - 19:30';

  const systemPrompt = `Bạn là trợ lý quản lý công việc và lịch trình cá nhân thông minh của "${userName}".
Thời gian thực hiện tại là: ${dateInfo.fullClock} (Hôm nay là ${dateInfo.todayShort}, Ngày mai là ${dateInfo.tomorrowShort}).
Nhiệm vụ của bạn là phân tích yêu cầu bằng ngôn ngữ tự nhiên tiếng Việt của ${userName}, sau đó cập nhật lại danh sách công việc (tasks) theo Ma trận Eisenhower 4 mức ưu tiên và Thời khóa biểu (schedule) cho Hôm nay (today - ${dateInfo.todayShort}) và Ngày mai (tomorrow - ${dateInfo.tomorrowShort}).

LƯU Ý ĐẶC BIỆT VỀ NHỊP SINH HOẠT CỦA ${userName}:
- Giờ ăn & nghỉ trưa: ${lunchTime}
- Giờ ăn tối & thư giãn: ${dinnerTime}
👉 KHI XẾP CÔNG VIỆC MỚI, HÃY TỰ ĐỘNG NÉ CÁC KHUNG GIỜ ĂN NGHỈ NÀY RA, KHÔNG ĐƯỢC XẾP ĐÈ CÔNG VIỆC VÀO GIỜ NGHỈ NGƠI VÀ ĂN UỐNG CỦA ${userName}!

QUY TẮC PHÂN LOẠI 4 MỨC ƯU TIÊN (DÙNG "ƯU TIÊN 1, 2, 3, 4" - P1, P2, P3, P4):
- 'q1' (ƯU TIÊN 1 - LÀM NGAY: Quan trọng & Khẩn cấp): Các việc có deadline gấp trong hôm nay hoặc sáng mai, việc khẩn cấp phải làm ngay.
- 'q2' (ƯU TIÊN 2 - LÊN LỊCH: Quan trọng & Không khẩn cấp): Việc học tập, rèn luyện sức khỏe, công việc có kế hoạch dài hạn.
- 'q3' (ƯU TIÊN 3 - XỬ LÝ NHANH: Không quan trọng & Khẩn cấp): Việc vặt phát sinh, trả lời tin nhắn, họp hành nhỏ.
- 'q4' (ƯU TIÊN 4 - ĐỂ SAU: Không quan trọng & Không khẩn cấp): Giải trí, việc bổ sung khi rảnh.

QUY TẮC CẬP NHẬT:
1. Nếu ${userName} báo đã làm xong việc gì, hãy đổi 'completed: true' và 'urgentAlert: false' cho công việc tương ứng trong 'tasks' VÀ các khung giờ liên quan trong 'schedule'.
2. Nếu ${userName} báo chưa làm kịp việc gì trong hôm nay hoặc muốn dời sang ngày mai (Carry-over), hãy giữ nguyên việc đó, gắn nhãn 'carryOver: "Đẩy sang ${dateInfo.tomorrowShort}"', và chuyển khung giờ đó từ 'schedule.today' sang 'schedule.tomorrow'.
3. Nếu ${userName} thêm công việc mới, hãy phân loại vào quadrant hợp lý ('q1', 'q2', 'q3', 'q4') và xếp khung giờ vào 'schedule.today' hoặc 'schedule.tomorrow' (định dạng giờ chuẩn HH:mm - HH:mm).
4. Trường 'tag' trong schedule ghi là 'Ưu tiên 1', 'Ưu tiên 2', 'Ưu tiên 3', 'Ưu tiên 4', hoặc 'Sinh hoạt', 'Nghỉ ngơi'.
5. Trường 'tagColor' trong schedule chỉ nhận 1 trong 5 giá trị: 'rose' (cho Ưu tiên 1), 'indigo' (cho Ưu tiên 2), 'amber' (cho Ưu tiên 3), 'emerald' (cho Ưu tiên 4), hoặc 'slate' (cho Nghỉ ngơi/Sinh hoạt).
6. Trường 'aiMessage': Viết câu phản hồi ngắn gọn, thân thiện, xưng "tui" và gọi người dùng là "${userName}", nhắc tới thứ ngày thực tế (${dateInfo.todayShort}).`;

  const userPrompt = `Dữ liệu hiện tại của ${userName}:
TASKS HIỆN TẠI:
${JSON.stringify(tasks, null, 2)}

THỜI KHÓA BIỂU HIỆN TẠI:
${JSON.stringify(schedule, null, 2)}

LỆNH MỚI CỦA ${userName}: "${commandText}"

Hãy trả về JSON chứa tasks mới, schedule mới và aiMessage.`;

  return {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          tasks: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                title: { type: 'STRING' },
                note: { type: 'STRING' },
                quadrant: { type: 'STRING' },
                completed: { type: 'BOOLEAN' },
                carryOver: { type: 'STRING' },
                urgentAlert: { type: 'BOOLEAN' }
              },
              required: ['id', 'title', 'note', 'quadrant', 'completed']
            }
          },
          schedule: {
            type: 'OBJECT',
            properties: {
              today: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    time: { type: 'STRING' },
                    title: { type: 'STRING' },
                    note: { type: 'STRING' },
                    tag: { type: 'STRING' },
                    tagColor: { type: 'STRING' },
                    completed: { type: 'BOOLEAN' },
                    isUrgentCountdown: { type: 'BOOLEAN' }
                  },
                  required: ['id', 'time', 'title', 'note', 'tag', 'tagColor', 'completed']
                }
              },
              tomorrow: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    time: { type: 'STRING' },
                    title: { type: 'STRING' },
                    note: { type: 'STRING' },
                    tag: { type: 'STRING' },
                    tagColor: { type: 'STRING' },
                    completed: { type: 'BOOLEAN' }
                  },
                  required: ['id', 'time', 'title', 'note', 'tag', 'tagColor', 'completed']
                }
              }
            },
            required: ['today', 'tomorrow']
          },
          aiMessage: { type: 'STRING' }
        },
        required: ['tasks', 'schedule', 'aiMessage']
      }
    }
  };
};
