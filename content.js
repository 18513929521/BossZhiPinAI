// 在文件顶部添加以下代码，确保content script已准备好接收消息
console.log('content.js-Boss直聘助手内容脚本已加载');

// 创建悬浮球元素
const floatingBall = document.createElement('div');
floatingBall.className = 'floating-ball';
// 创建图标元素
const icon = document.createElement('div');
icon.className = 'icon';
icon.style.backgroundImage = 'url("https://test-benefit.yuanforce.com/platform/img/logo.cd3df442.png")'; // 确保路径正确
icon.style.backgroundSize = 'cover'; // 确保图标填满整个div
floatingBall.appendChild(icon);
// 将悬浮球添加到页面
// document.body.appendChild(floatingBall);

const popup = document.createElement('div');
popup.className = 'container';
popup.id = 'popup-content';
popup.innerHTML = `
    <h1>原力智能招聘助理</h1>
    <div id="login-status">
      <p id="status-message">请刷新登录状态</p>
      <button id="login-button" >刷新登录状态</button>
    </div>
    <label for="score-threshold">大于 
      <input type="number" style="width: 80px;" id="score-threshold" placeholder="评分">
     分自动打招呼</label>
    <select id="resume-format">
      <option value="all">全部简历</option>
      <option value="number">指定数量</option>
    </select>
    <div id="number-input" >
      <input style="margin-left: 0px;" type="number" id="resume-number" placeholder="请输入简历个数">
    </div>
    
    <button id="fetch-button">获取简历信息</button>  
    <div style="display: flex;justify-content: space-between;align-items: center;">
      <p >检索到简历<span id="retrieve-resume">0</span>条</p>
      <p >已打招呼<span id="recommend-message">0</span>次</p>
    </div>
   
    <!-- <button id="communicateButton">自动沟通</button>   -->
    <div id="job-export" >
      <div class="export-options">
        <p style="width: 100px;">导出格式：</p>
        <select id="export-format">
          <option value="excel">Excel</option>
          <option value="text">纯文本</option>
        </select>
      </div>
      <div  style="display: flex;justify-content: space-between;align-items: center;">
        <button id="export-button">导出<span style="margin: 0PX 5PX;" id="recommend-message1">110</span>条</button>
        <button id="clear-button">清空</button>
      </div>
    </div>
        `
// 将页面添加到页面
// document.body.appendChild(popup);
popup.style.display = 'none';
// 添加点击事件处理
floatingBall.addEventListener('click', function () {
  // 创建页面
  const popupContent = document.getElementById('popup-content');
  if (popupContent.style.display === 'none') {
    popupContent.style.display = 'block';
  } else {
    popupContent.style.display = 'none';
  }
});

//=======================分割线===========================
//测试AI账户手动提交代码
// 全局变量存储职位信息
let jobsData = [];
let selectedOption = 'all'
let numberValue = NaN;
let num = 0;
let jobId = '';


// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'checkLoginStatus':
      const isLoggedIn = checkLoginStatus();
      if (isLoggedIn) {
        // throttledGetOpenAi()
      } else {

      }
      break;
    case 'scoreThresholdChange':
      num = Number(request.scoreThreshold) || 0;
      break;
    case 'scrapeJobData':
      scrapeJobData(); //获取职位信息
      sendResponse({ success: true, count: jobsData.length });
      break;
    case 'getJobList':
      console.log('获取简历', request.selectedOption, request.numberValue);
      selectedOption = request.selectedOption;
      numberValue = Number(request.numberValue);
      getJobList(1);
      break;
    case 'communicate':
      console.log('自动沟通');

      webChat(); //打开Boss直聘聊天页面













      break;
    case 'remeberJobId':
      console.log('content.js-存储职位ID', request.jobId);
      jobId = request.jobId;
      break;
    default:
      break;
  }
  return true;
});

// 通知background script内容脚本已加载
chrome.runtime.sendMessage({ action: 'contentScriptReady' }, (response) => {
  // 忽略可能的连接错误
  if (chrome.runtime.lastError) {
    console.log('content.js-无法连接到后台脚本:', chrome.runtime.lastError.message);
  }
});


chrome.storage.local.get(['scoreThreshold'], (data) => {
  if (chrome.runtime.lastError) {
    console.error('无法获取 scoreThreshold:', chrome.runtime.lastError.message);
  } else {
    num = Number(data.scoreThreshold) || 0;
  }
});
// 检测登录状态
function checkLoginStatus() {
  // Boss直聘登录后通常会显示用户头像和用户名
  const userAvatar = document.querySelector('.avatar-content img') ||
    document.querySelector('.badge');
  const userName = document.querySelector('.label-name .user-name')

  if (userAvatar && userName) {
    // 用户已登录
    const username = userName.textContent.trim();
    // showNotification(`已登录，当前账号：${username}`, true);

    // 存储登录状态
    chrome.storage.local.set({
      bossLoginStatus: {
        isLoggedIn: true,
        username: username
      }
    });

    // 开始获取职位信息
    // setTimeout(scrapeJobData, 1000);  //获取推荐列表中的职位信息
    jobsData = [];
    return true;
  } else {
    // 用户未登录
    // showNotification('您尚未登录，请登录Boss直聘', false);

    // 存储登录状态
    chrome.storage.local.set({
      bossLoginStatus: {
        isLoggedIn: false,
        username: ''
      }
    });
    return false;
  }
}

function webChat() {
  // 打开Boss直聘聊天页面
  const menuChatElement = document.querySelector('dl.menu-chat a[href="/web/chat/index"]') || document.querySelector('dl.menu-chat dt a[href="/web/chat/index?ka=menu-im"]');
  menuChatElement.click();
  setTimeout(() => {
    // 找到沟通中标签
    const communicateDiv = document.querySelector('div.chat-label-item[title="沟通中"]');
    if (communicateDiv) {
      // 判断是否选中
      if (!communicateDiv.classList.contains('selected')) {
        // 如果未选中，则点击该 div
        communicateDiv.click();
        geekItem(); //打开聊天页面，找到第一个未读联系人，点击
      }
    }
  }, 300)
}

function geekItem() {
  setTimeout(() => {
    // 找到所有联系人项
    const chatItems = document.querySelectorAll('.geek-item-wrap .geek-item');
    // 遍历联系人项，找到第一个有未读角标的联系人
    let firstUnreadContact = null;
    for (const item of chatItems) {
      const unreadBadge = item.querySelector('.push-text');
      if (unreadBadge) {
        firstUnreadContact = item;
        break;
      }
    }
    // 如果找到了未读联系人，触发点击事件
    if (firstUnreadContact) {
      firstUnreadContact.click();
      setTimeout(() => {
        agreeButton();
      }, 300);
    }
  }, 300);
}

//发送聊天消息
function sendInput() {
  const inputElement = document.getElementById('boss-chat-editor-input'); // 这里假设你要控制的是文本类型的输入框
  if (inputElement) {
    inputElement.innerHTML = '测试输入内容';
    setTimeout(() => {
      const sendButtonDiv = document.querySelector('div.submit.active');
      if (sendButtonDiv) {
        sendButtonDiv.click();
      }
    }, 300);
  }
}

//接收简历
function agreeButton() {
  // 找到同意按钮
  const agreeButton = document.querySelector('span.card-btn[d-c="61031"]:not(.disabled)');
  // 如果同意按钮存在且没有被禁用，则点击它
  if (agreeButton) {
    agreeButton.click();
  }
}

// 显示通知
function showNotification(message, isLoggedIn) {
  // 移除可能已存在的通知
  removeExistingNotification();

  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'boss-assistant-notification';
  notification.id = 'boss-assistant-notification';

  const title = document.createElement('h3');
  title.textContent = '投递助手';

  const content = document.createElement('p');
  content.textContent = message;

  notification.appendChild(title);
  notification.appendChild(content);

  // 如果未登录，添加登录按钮
  if (!isLoggedIn) {
    const loginButton = document.createElement('button');
    loginButton.textContent = '立即登录';
    loginButton.addEventListener('click', () => {
      window.location.href = 'https://www.zhipin.com/web/user/?ka=header-login';
    });
    notification.appendChild(loginButton);
  }

  document.body.appendChild(notification);

  // 5秒后自动关闭通知
  setTimeout(removeExistingNotification, 5000);
}

// 移除已存在的通知
function removeExistingNotification() {
  const existingNotification = document.getElementById('boss-assistant-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
}

// 获取职位信息
function scrapeJobData() {
  // 检查是否在职位推荐页面
  if (!window.location.href.includes('zhipin.com')) {
    return;
  }

  // 获取职位列表 - 更新选择器以适应最新的页面结构
  const jobCards = document.querySelectorAll('.rec-job-list .job-card-wrap');

  if (jobCards.length === 0) {
    console.log('content.js-未找到职位信息，尝试其他选择器');
    // 尝试其他可能的选择器
    const alternativeJobCards = document.querySelectorAll('.job-list-box .job-card') ||
      document.querySelectorAll('.job-list .job-primary');

    if (alternativeJobCards.length === 0) {
      console.log('content.js-仍未找到职位信息，请检查页面结构');
      return;
    }
    processJobCards(alternativeJobCards);
  } else {
    processJobCards(jobCards);
  }
}

// 处理职位卡片
function processJobCards(jobCards) {
  jobsData = [];

  jobCards.forEach((card, index) => {
    try {
      // 职位名称 - 更新选择器
      const title = card.querySelector('.job-name') ||
        card.querySelector('.job-title');

      // 公司名称 - 更新选择器
      const company = card.querySelector('.boss-name');

      // 薪资范围 - 更新选择器
      const salary = card.querySelector('.job-salary');

      // 工作地点 - 更新选择器
      const location = card.querySelector('.company-location');

      // 发布时间 - 可能没有直接显示
      const publishTime = { textContent: new Date().toLocaleDateString() }; // 默认使用当前日期

      // 职位标签 - 更新选择器
      const tagElements = card.querySelectorAll('.tag-list li');
      const tags = Array.from(tagElements)
        .map(tag => tag.textContent.trim())
        .join('、');

      // 职位描述 - 更新选择器
      const description = card.querySelector('.job-card-footer');

      // 构建职位数据对象
      const jobData = {
        序号: index + 1 + '',
        职位名称: title ? title.textContent.trim() : '',
        公司名称: company ? company.textContent.trim() : '',
        薪资范围: salary ? salary.textContent.trim() : '',
        工作地点: location ? location.textContent.trim() : '',
        发布时间: publishTime ? publishTime.textContent.trim() : '',
        公司规模: '', // 在当前页面可能无法获取
        行业领域: '', // 在当前页面可能无法获取
        职位标签: tags,
        职位描述: description ? description.textContent.trim() : ''
      };

      jobsData.push(jobData);
    } catch (error) {
      console.error('content.js-解析职位信息出错:', error);
    }
  });

  // 存储职位数据
  if (jobsData.length > 0) {
    chrome.storage.local.set({ bossJobsData: jobsData }, () => {
      console.log(`content.js-已获取 ${jobsData.length} 条职位信息`);
      showNotification(`已成功获取 ${jobsData.length} 条职位信息`, true);
    });
  }
}

// 页面加载完成后执行 
// window.addEventListener('load', () => {
// 延迟执行，确保页面元素已完全加载
// setTimeout(checkLoginStatus, 1500);
// });




// 定义一个函数，用于分页获取职位列表数据
function getJobList(page) {
  // 构造请求的URL，其中包含分页参数page
  let url = 'https://www.zhipin.com/wapi/zpjob/rec/geek/list?pageSize=15&page=' + page + '&jobId=' + jobId
  // 使用fetch函数发送GET请求
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(response => response.json())
    .then(data => {
      // 将捕获到的内容发送到后台脚本
      // chrome.runtime.sendMessage({ type: 'networkRequest', data: data });
      let geekdata = []
      data.zpData.geekList.forEach(item => {
        geekdata.push({
          geekName: item.geekCard.geekName,
          ageDesc: item.geekCard.ageDesc,
          geekWorkYear: item.geekCard.geekWorkYear,
          geekDegree: item.geekCard.geekDegree,
          expectPositionName: item.geekCard.expectPositionName,
          expectLocationName: item.geekCard.expectLocationName,
          securityId: item.geekCard.securityId,
          gid: item.geekCard.encryptGeekId,
          jid: item.geekCard.encryptJobId,
          expectId: item.geekCard.expectId,
        })
      })

      // 将获取到的职位数据拼接到jobsData数组中
      // jobsData = [geekdata[0],geekdata[1]]//[data.zpData.geekList[0]]
      jobsData = jobsData.concat(geekdata); // 合并数组

      if (selectedOption == 'all') {
        // 如果当前页的职位数据长度为15，则继续请求下一页
        if (data.zpData.jobList.length == 15) {
          // if (jobsData.length <= 30) {
          setTimeout(() => {
            getJobList(page + 1);
          }, 2000);

        } else {
          // 如果当前页的职位数据长度不为15，则停止请求
          fetchAndProcessJobsData() // 获取职位详情
        }
      } else {
        if (numberValue <= 15) {
          jobsData = jobsData.slice(0, numberValue) // 截取指定数量的职位数据
          fetchAndProcessJobsData() // 如果当前页的职位数据长度不为15，则停止请求获取职位详情
        } else {
          if (numberValue / 15 > page) {
            setTimeout(() => {
              getJobList(page + 1);
            }, 2000);
          } else {
            jobsData = jobsData.slice(0, numberValue) // 截取指定数量的职位数据
            fetchAndProcessJobsData() // 获取职位详情
          }
        }
      }

    })
    .then(() => {
      chrome.runtime.sendMessage({ type: 'jobsLength', data: jobsData.length });
      // console.log(JSON.stringify(jobsData));
      // getOpenAi();

    })
    .catch(error => {
      console.error('请求失败：', error);
    });
}

function getJobDetail(job) {
  // 构造请求的URL，其中包含职位ID参数jobid
  const url = `https://www.zhipin.com/wapi/zpjob/view/geek/info?securityId=${job.securityId}`;
  // 使用fetch函数发送GET请求
  return fetch(url, {
    method: 'GET', // 指定请求方法为GET
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`请求失败，状态码：${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('获取职位详情信息出错：', error);
      return null; // 返回null以避免后续处理出错
    });
}

function getOpenAi(prompt) {
  let appid = '587b49abd2fb499b8870084ea56cf7cc'
  let appkey = 'sk-9df6e1b1e294414cbf046fbccfb9b086'

  let jsonData = {
    input: {
      prompt: prompt // 替换为实际 Prompt 内容
    }
  };
  fetch(`https://dashscope.aliyuncs.com/api/v1/apps/${appid}/completion`, {
    method: 'POST',
    body: JSON.stringify(jsonData),
    headers: {
      'Authorization': `Bearer ${appkey}`,
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码: ${response.status}`);
    }
    return response.json();
  })
    .then(data => {
      console.log('AI接口请求成功:', data.output.text);
      return JSON.parse(data.output.text);//将AI的数据返回
      // chrome.storage.local.set({ bossJobsData: JSON.parse(data.output.text) });
    })
    .catch(error => {
      console.error('AI接口请求失败:', error);
    });
}

//打招呼
function sayHello(index, job) {
  // 构造请求的URL，其中包含职位ID参数jobid
  const url = `https://www.zhipin.com/wapi/zpjob/chat/start?securityId=${job.securityId}&gid=${job.gid}&jid=${job.jid}&expectId=${job.expectId}`;
  // 使用fetch函数发送GET请求
  fetch(url, {
    method: 'GET', // 指定请求方法为GET
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`请求失败，状态码：${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.zpData.limitTitle == '今日沟通已达上限') {
        return false;
      } else {
        if (data.zpData.greeting == '') {
          return true;
        } else {
          chrome.storage.local.get(['bossJobsData'], result => {
            let jobsDataArray = result.bossJobsData || [];
            // 将新数据添加到数组中
            jobsDataArray.push(job.openAiResult[0]);
            // 将更新后的数组存回本地存储
            chrome.storage.local.set({ bossJobsData: jobsDataArray });
            chrome.runtime.sendMessage({ type: 'bossJobsLength', data: jobsDataArray.length });

          })
          return true;
        }
      }
    })
    .catch(error => {
      console.error('获取职位详情信息出错：', error);
      return null; // 返回null以避免后续处理出错
    });
}

// 定义一个delay函数，用于返回一个延迟指定时间的Promise
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

let throttledGetOpenAi = debounce(getOpenAi, 500);



async function fetchAndProcessJobsData() {
  try {
    // 使用 for...of 循环确保顺序执行
    for (const [index, job] of jobsData.entries()) {
      try {
        // 获取职位详情
        let jobDetail = await getJobDetail(job);
        if (jobDetail.zpData.blockDialog && jobDetail.zpData.blockDialog.title == '今日查看已达上限') {
          return false;
        } else {
          delete jobDetail.zpData.geekDetailInfo.attachCheckRes
          delete jobDetail.zpData.geekDetailInfo.attachmentResumeChatInfo
          delete jobDetail.zpData.geekDetailInfo.authentication
          delete jobDetail.zpData.geekDetailInfo.blueGeekCharacters
          delete jobDetail.zpData.geekDetailInfo.blueGeekSkills
          delete jobDetail.zpData.geekDetailInfo.distanceText
          delete jobDetail.zpData.geekDetailInfo.eduExpCheckRes
          delete jobDetail.zpData.geekDetailInfo.encryptJid
          delete jobDetail.zpData.geekDetailInfo.enshrineGeek
          delete jobDetail.zpData.geekDetailInfo.fromInterestListAnymous
          delete jobDetail.zpData.geekDetailInfo.geekWorkPositionExpDescList
          delete jobDetail.zpData.geekDetailInfo.geekWorksResume
          delete jobDetail.zpData.geekDetailInfo.groupMemberList
          delete jobDetail.zpData.geekDetailInfo.groupTitle
          delete jobDetail.zpData.geekDetailInfo.hasOverLapWorkExp
          delete jobDetail.zpData.geekDetailInfo.hideFullNameProcessed
          delete jobDetail.zpData.geekDetailInfo.hitGeekProductUpperRight
          delete jobDetail.zpData.geekDetailInfo.hitGeekUpperRightGray
          delete jobDetail.zpData.geekDetailInfo.hitGeekWorkExpGray
          delete jobDetail.zpData.geekDetailInfo.languageCertList
          delete jobDetail.zpData.geekDetailInfo.mbtiInfo
          delete jobDetail.zpData.geekDetailInfo.multiGeekVideoResume4BossVO
          delete jobDetail.zpData.geekDetailInfo.nonMatchWorkExpIndex
          delete jobDetail.zpData.geekDetailInfo.personalImageList
          delete jobDetail.zpData.geekDetailInfo.postExpData
          delete jobDetail.zpData.geekDetailInfo.professionalSkill
          delete jobDetail.zpData.geekDetailInfo.rcdGeekLabel
          delete jobDetail.zpData.geekDetailInfo.resumeSummary
          delete jobDetail.zpData.geekDetailInfo.resumeVideoInfo
          delete jobDetail.zpData.geekDetailInfo.showExpectPosition
          delete jobDetail.zpData.geekDetailInfo.showJobExperienceTip
          delete jobDetail.zpData.geekDetailInfo.showWorkExpDescFlag
          delete jobDetail.zpData.geekDetailInfo.speakTestResult
          delete jobDetail.zpData.geekDetailInfo.supportInterested
          delete jobDetail.zpData.geekDetailInfo.toAnswerDetailUrl
          delete jobDetail.zpData.geekDetailInfo.toast
          delete jobDetail.zpData.geekDetailInfo.trickGeekQuestionAnswers
          delete jobDetail.zpData.geekDetailInfo.v110304
          delete jobDetail.zpData.geekDetailInfo.workExpCheckRes

          job.detail = jobDetail.zpData.geekDetailInfo


          // 调用 AI 接口并存储结果
          job.openAiResult = await getOpenAiTest(job);
          // 执行打招呼逻辑, 条件：AI分数大于60分
          if (Number(job.openAiResult.geekScore) > num) {
            console.log('打招呼-当前得分：' + job.openAiResult.geekScore);
            return await sayHello(index, job);
          }
        }

      } catch (error) {
        console.error(`处理第 ${index + 1} 个职位时出错:`, error);
      }
    }
  } catch (error) {
    console.error('整体处理失败:', error);
  }
}

async function getOpenAiTest(prompt1) {
  let appid = '587b49abd2fb499b8870084ea56cf7cc'
  let appkey = 'sk-9df6e1b1e294414cbf046fbccfb9b086'

  let jsonData = {
    input: {
      prompt: prompt1 // 替换为实际 Prompt 内容
    }
  };
  try {
    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/apps/${appid}/completion`, {
      method: 'POST',
      body: JSON.stringify(jsonData),
      headers: {
        'Authorization': `Bearer ${appkey}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码: ${response.status}`);
    }
    const data = await response.json();
    console.log('AI接口请求成功:', data.output.text);
    return JSON.parse(data.output.text);
  } catch (error) {
    console.error('AI接口请求失败:', error);
    return null; // 返回 null 以避免后续处理出错
  }
}



