document.addEventListener('DOMContentLoaded', function () {
  const statusMessage = document.getElementById('status-message'); // 状态信息
  const loginButton = document.getElementById('login-button'); // 登录按钮
  const jobExportDiv = document.getElementById('job-export'); // 职位导出div
  const exportButton = document.getElementById('export-button');  // 导出按钮
  const recommendMessage = document.getElementById('recommend-message');  // 推荐信息
  const recommendMessage1 = document.getElementById('recommend-message1');  // 推荐信息
  const resumeFormat = document.getElementById('resume-format'); // 简历格式选择
  const numberInput = document.getElementById('number-input');    // 简历数量box
  const resumeNumber = document.getElementById('resume-number'); // 简历数量值
  const fetchButton = document.getElementById('fetch-button'); // 获取简历按钮
  const scoreThreshold = document.getElementById('score-threshold'); // 推荐分数阈值
  const retrieveResume = document.getElementById('retrieve-resume'); // 检索简历条目
  const clearButton = document.getElementById('clear-button'); // 清空本地简历数据

  // 检查登录状态
  initLoginStatus();

  // 登录按钮点击事件
  loginButton.addEventListener('click', function () {
    // chrome.tabs.create({ url: 'https://www.zhipin.com/web/user/?ka=header-login' });
    initLoginStatus();
  });
  //选择简历加在数量
  resumeFormat.addEventListener('change', function () {
    if (this.value === 'number') {
      numberInput.classList.add('show');
      if (resumeNumber.value == '') {
        fetchButton.classList.add('hide');
      } else {
        fetchButton.classList.remove('hide');
      }
    } else {
      numberInput.classList.remove('show');
      fetchButton.classList.remove('hide');
    }
  });

  resumeNumber.addEventListener('input', function () {
    if (resumeNumber.value == 0) {
      fetchButton.classList.add('hide');
    } else {
      fetchButton.classList.remove('hide');
    }
  })

  scoreThreshold.addEventListener('input', function () {
    if(scoreThreshold.value == ''){
      scoreThreshold.value = 0;
    }   
    // 将阈值保存到本地存储
    chrome.storage.local.set({ scoreThreshold: scoreThreshold.value });

    // 向content script发送消息，检查登录状态，添加错误处理
    chrome.tabs.sendMessage(currentTab.id, { action: 'scoreThresholdChange',scoreThreshold:scoreThreshold.value }, function(response) {});
  })

  // 获取简历
  fetchButton.addEventListener('click', () => {
    const selectedOption = resumeFormat.value;
    const numberValue = numberInput.classList.contains('show') ? resumeNumber.value : NaN;

    if (selectedOption == 'number' && numberValue == '') {
      // alert('请输入个数');
      return;
    } else {
      chrome.tabs.sendMessage(currentTab.id, { action: 'getJobList', selectedOption: selectedOption, numberValue: numberValue }, function (response) {

      });

    }
  });

  // 沟通
  document.getElementById('communicateButton').addEventListener('click', () => {
    chrome.tabs.sendMessage(currentTab.id, { action: 'communicate' }, function (response) {
    });
  });
  // 导出按钮点击事件
  exportButton.addEventListener('click', function () {
    const format = document.getElementById('export-format').value;
    exportJobData(format);
  });
  // 清空本地简历数据
  clearButton.addEventListener('click', function () {
    chrome.storage.local.remove(['bossJobsData']);
    jobExportDiv.style.display = 'none';
    recommendMessage.textContent = 0;
    recommendMessage1.textContent = 0;
    retrieveResume.textContent = 0;
  });
  let currentTab = null
  // 检查登录状态函数
  function initLoginStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

      currentTab = tabs[0];
      // 检查是否在Boss直聘网站
      if (!currentTab.url.includes('zhipin.com')) {
        statusMessage.textContent = '请在Boss直聘网站上使用此插件';
        return;
      }
      console.log('popup.js-初始化');

      // 从存储中获取登录状态
      chrome.storage.local.get(['bossLoginStatus', 'bossJobsData'], function (data) {
        if (data.bossLoginStatus && data.bossLoginStatus.isLoggedIn) {
          // 已登录
          statusMessage.textContent = `已登录，当前账号：${data.bossLoginStatus.username}`;
          loginButton.style.display = 'none';
          chrome.storage.local.get(['scoreThreshold'], function (data) {
            scoreThreshold.value = data.scoreThreshold || 0;
          });
          // 检查是否有职位数据
          if (data.bossJobsData && data.bossJobsData.length > 0) {
            jobExportDiv.style.display = 'block';
            recommendMessage.textContent = data.bossJobsData.length||0;
            recommendMessage1.textContent = data.bossJobsData.length||0;
          }else{
            jobExportDiv.style.display = 'none';
            recommendMessage.textContent = 0;
            recommendMessage1.textContent = 0;
          }
          // else {
            // // 尝试获取职位数据，添加错误处理
            // chrome.tabs.sendMessage(currentTab.id, { action: 'scrapeJobData' }, function(response) {
            //   // 处理可能的连接错误
            //   if (chrome.runtime.lastError) {
            //     console.log('无法连接到内容脚本:', chrome.runtime.lastError.message);
            //     statusMessage.textContent += '，但无法获取职位信息，请刷新页面后重试';
            //     return;
            //   }

            //   if (response && response.success && response.count > 0) {
            //     jobExportDiv.style.display = 'block';
            //   } else {
            //     jobExportDiv.style.display = 'none';
            //     statusMessage.textContent += '，但未找到职位信息，请确保您在职位推荐页面';
            //   }
            // });
          // }
        } else {
          // 未登录
          statusMessage.textContent = '您尚未登录，请登录Boss直聘';
          loginButton.style.display = 'block';
          jobExportDiv.style.display = 'none';

          // 向content script发送消息，检查登录状态，添加错误处理
          chrome.tabs.sendMessage(currentTab.id, { action: 'checkLoginStatus' }, function(response) {
            // 忽略连接错误
            if (chrome.runtime.lastError) {
              // alert('无法连接到招聘网址，请刷新页面后重试');
              return;
            }
          });
        }
      });
    });
  }

  // 导出职位数据函数
  function exportJobData(format) {
    chrome.storage.local.get('bossJobsData', function (data) {
      if (!data.bossJobsData || data.bossJobsData.length === 0) {
        alert('没有可导出的简历数据');
        return;
      }

      const jobsData = data.bossJobsData;
      let content = '';
      let filename = `Boss直聘简历信息_${new Date().toLocaleDateString()}`;

      switch (format) {
        case 'excel':
          // 实际上我们生成的是CSV，但Excel可以打开它
          content = convertToCSV(jobsData);
          filename += '.xlsx';
          break;
        case 'text':
          content = convertToText(jobsData);
          filename += '.txt';
          break;
      }

      // //创建下载链接
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      // // 清理URL对象
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
  }
  const tableTitle = {
    geekScore: '岗位评分',
    geekName: '姓名',
    ageDesc: '年龄',
    geekDegree: '学历',
    geekWorkYear: '工作年限',
    expectPositionName: '应聘岗位',
    expectLocationName: '工作地点',
    advantage: '优点',
    disadvantage: '缺点',
    report: '评分报告',
  }

  const tableTitleKey = {
    岗位评分: 'geekScore',
    姓名: 'geekName',
    年龄: 'ageDesc',
    学历: 'geekDegree',
    工作年限: 'geekWorkYear',
    应聘岗位: 'expectPositionName',
    工作地点: 'expectLocationName',
    优点: 'advantage',
    缺点: 'disadvantage',
    评分报告: 'report',
  }

  const tableHeader = Object.keys(tableTitle).map(key => tableTitle[key]).join(',');


  // 转换为CSV格式
  function convertToCSV(jobsData) {
    if (jobsData.length === 0) return '';
    // 获取表头
    const headers = tableHeader.split(',') //Object.keys(jobsData[0]);
    // 创建CSV内容
    let csv = tableHeader + '\n';
    // 添加数据行
    jobsData.forEach(job => {
      const row = headers.map(header => {
        // 处理可能包含逗号的字段
        let field = job[tableTitleKey[header]] + '' || '';
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          field = `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
      csv += row.join(',') + '\n';
    });
    return '\ufeff' + csv; // 添加BOM标记以支持中文
  }

  // 转换为纯文本格式
  function convertToText(jobsData) {
    if (jobsData.length === 0) return '';

    let text = '';

    jobsData.forEach(job => {
      text += '----------------------------------------\n';
      text += `岗位评分: ${job.geekScore}\n`;
      text += `姓名: ${job.geekName}\n`;
      text += `年龄: ${job.ageDesc}\n`;
      text += `工作年限: ${job.geekWorkYear}\n`;
      text += `学历: ${job.geekDegree}\n`;
      text += `应聘岗位: ${job.expectPositionName}\n`;
      text += `工作地点: ${job.expectLocationName}\n`;
      text += `优点: ${job.advantage}\n`;
      text += `缺点: ${job.disadvantage}\n`;
      text += `评分报告: ${job.report}\n`;
      text += '----------------------------------------\n\n';
    });

    return text;
  }


  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'bossJobsLength') {
      // 在这里您可以更新 UI 或执行其他操作
      recommendMessage.textContent = request.data;
      recommendMessage1.textContent = request.data;
      jobExportDiv.style.display = 'block';
    }
    if(request.type === 'jobsLength'){
      retrieveResume.textContent = request.data;
    }
  });
});





