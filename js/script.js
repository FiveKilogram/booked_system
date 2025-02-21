// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAsDdYvYPFendZkc-w6_HqzF0skk-kj_bk",
    authDomain: "renwu-f96c0.firebaseapp.com",
    projectId: "renwu-f96c0",
    storageBucket: "renwu-f96c0.firebasestorage.app",
    messagingSenderId: "760006597971",
    appId: "1:760006597971:web:a3f4f68c04e3911fc655a6",
    measurementId: "G-SMV4XQZ2B9"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 工作人员数据，固定为李楠
const staffMembers = [
    { id: 1, name: '李楠' }
];

// 时间段数据
const timeSlots = [
    { id: 1, time: '10:00 - 12:00' },
    { id: 2, time: '12:00 - 14:00' },
    { id: 3, time: '14:00 - 16:00' },
    { id: 4, time: '16:00 - 18:00' },
    { id: 5, time: '18:00 - 20:00' },
    { id: 6, time: '20:00 - 22:00' }
];

// 获取当前日期
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// 获取近两周的日期数组
function getRecentTwoWeeksDates() {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

// 初始化任务表格
async function initScheduleTable(selectedDates) {
    const table = document.getElementById('scheduleTable');
    table.innerHTML = '';

    try {
        const snapshot = await database.ref('tasks').once('value');
        const tasks = snapshot.val() || {};

        // 遍历近两周的日期
        selectedDates.forEach(selectedDate => {
            const dateDiv = document.createElement('div');
            dateDiv.textContent = selectedDate;
            table.appendChild(dateDiv);

            staffMembers.forEach(staff => {
                const staffDiv = document.createElement('div');
                staffDiv.className = 'room';

                const staffTitle = document.createElement('div');
                staffTitle.className = 'room-title';
                staffTitle.textContent = staff.name;
                staffDiv.appendChild(staffTitle);

                const slotsContainer = document.createElement('div');
                slotsContainer.className = 'slots-container';

                timeSlots.forEach(slot => {
                    const slotDiv = document.createElement('div');
                    slotDiv.className = 'time-slot';

                    const button = document.createElement('button');
                    const key = `${selectedDate}-${staff.id}-${slot.id}`;
                    const taskData = tasks[key];
                    const isBooked = !!taskData;

                    button.className = `booking-button ${isBooked ? 'booked' : ''}`;
                    button.textContent = slot.time;
                    button.onclick = () => toggleTask(selectedDate, staff.id, slot.id, button);

                    if (staff.name.includes('不可预约')) {
                        button.disabled = true;
                        button.classList.add('disabled');
                    }

                    slotDiv.appendChild(button);

                    if (isBooked && taskData.taskName) {
                        const taskNameDiv = document.createElement('div');
                        taskNameDiv.className = 'task-name';
                        taskNameDiv.textContent = taskData.taskName;
                        slotDiv.appendChild(taskNameDiv);
                    }

                    slotsContainer.appendChild(slotDiv);
                });

                staffDiv.appendChild(slotsContainer);
                table.appendChild(staffDiv);
            });
        });

    } catch (error) {
        console.error('加载失败:', error);
        alert('数据加载失败，请检查网络连接！');
    }
}

// 切换任务状态
async function toggleTask(selectedDate, staffId, slotId, button) {
    const key = `${selectedDate}-${staffId}-${slotId}`;

    try {
        const snapshot = await database.ref(`tasks/${key}`).once('value');
        const taskData = snapshot.val();
        const isBooked = !!taskData;

        if (isBooked) {
            await database.ref(`tasks/${key}`).remove();
            button.classList.remove('booked');
            const taskNameDiv = button.nextElementSibling;
            if (taskNameDiv?.classList.contains('task-name')) {
                taskNameDiv.remove();
            }
        } else {
            const taskName = prompt('请输入任务名称：');
            if (taskName) {
                await database.ref(`tasks/${key}`).set({
                    booked: true,
                    taskName: taskName
                });
                button.classList.add('booked');

                const taskNameDiv = document.createElement('div');
                taskNameDiv.className = 'task-name';
                taskNameDiv.textContent = taskName;
                button.parentNode.insertBefore(taskNameDiv, button.nextSibling);
            }
        }
    } catch (error) {
        console.error('操作失败:', error);
        alert('操作失败，请稍后重试！');
    }
}

// 初始化日期选择器（这里可以选择是否保留，因为默认展示近两周数据）
function initDatePicker() {
    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.value = getCurrentDate();
    datePicker.onchange = (e) => initScheduleTable([e.target.value]);

    const container = document.getElementById('datePickerContainer');
    container.innerHTML = '';
    container.appendChild(datePicker);
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    // initDatePicker(); // 如果不需要日期选择器，可以注释掉这一行
    const recentDates = getRecentTwoWeeksDates();
    initScheduleTable(recentDates);
});
