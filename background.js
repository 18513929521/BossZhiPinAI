

// 监听插件安装或更新
// chrome.runtime.onInstalled.addListener(() => {});
let tabIds = null;
// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  // 当页面完成加载且URL包含zhipin.com
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    tab.url.startsWith('http') && tab.url.includes('zhipin')
  ) {
    console.log('只调用一次吗?');
    tabIds = tabId;
    // 执行你的逻辑
    chrome.tabs.sendMessage(tabId, { action: 'checkLoginStatus' }, (response) => {
      // 忽略连接错误
      console.log(response);
    });
  }
});

// 监听内容脚本发送的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'networkRequest') {
    console.log(message);
    console.log(sender);
    console.log(sendResponse);

    // 每次请求时更新规则
    // updateRules().then(() => {
    //     console.log('规则更新成功，请求内容：', message.data);
    // }).catch((error) => {
    //     console.error('规则更新失败：', error);
    // });
  }
});

chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (details.url.includes("https://www.zhipin.com/wapi/zpjob/rec/geek/list?age=16")) {

      const jobId = details.url.split('&jobId=')[1].split('&')[0];
      // https://www.zhipin.com/wapi/zpjob/rec/geek/list?age=16,-1&school=0&activation=0&recentNotView=0&gender=0&exchangeResumeWithColleague=0&major=0&switchJobFrequency=0&keyword1=-1&degree=0&experience=0&intention=0&salary=0&jobId=bc0d2413038a3b6803Z53Nq0F1RU&page=1&coverScreenMemory=0&cardType=0
      console.log(jobId);
      // 执行你的逻辑
      chrome.tabs.sendMessage(tabIds, { action: 'remeberJobId', jobId: jobId }, (response) => {
        // 忽略连接错误
        console.log(response);
      });
    }
    if(details.url.includes("https://www.zhipin.com/wapi/zpchat/boss/historyMsg")){
      console.log(details.url);
      
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
