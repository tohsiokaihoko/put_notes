function getSCTUrl() {
  return "https://sct.iijplus.jp/";
}

function isSCTUrl(url) {
  // Return whether the URL starts with the SCT prefix.
  return url.indexOf(getSCTUrl()) == 0;
}

function goToSCT() {
  console.log('Going to SCT...');
  chrome.tabs.getAllInWindow(undefined, function(tabs) {
    for (var i = 0, tab; tab = tabs[i]; i++) {
      if (tab.url && isSCTUrl(tab.url)) {
        console.log('Found SCT tab: ' + tab.url + '. ' +
                    'Focusing and refreshing count...');
        chrome.tabs.update(tab.id, {selected: true});
        //startRequest({scheduleRequest:false, showLoadingAnimation:false});
        return;
      }
    }
    console.log('Could not find SCT tab. Creating one...');
    chrome.tabs.create({url: getSCTUrl()});
  });
}

function get_token(account, password, callback) {
    // POST送信
    $.ajax({
        type:"POST",
        url:"https://hotate-stg.bob.iiji.jp:4000/api/users/requestToken",
        data: {
          account: account,
          password: password
        },
        dataType:"json",
        success: function(res) {
            var msg = "";
            switch(res.code) {
                case 200:
                    msg = res.detail.token;
                    callback(msg);
                    break;
                default:
                    msg = res.message + "(" + res.detail + ")";
                    callback();
                    break;
            }
            console.log(msg);
        },
        error: function(req, status, errorThrown) {
            console.log(errorThrown);
            callback();
        }
    });
}

chrome.browserAction.onClicked.addListener(goToSCT);
chrome.browserAction.setBadgeBackgroundColor({color:[23,165,174,255]});
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) 
    {
        switch(request.action) 
        {
            case 'get' :
                sendResponse(
                {
                    account: localStorage["account"],
                    token: localStorage["token"],
                    boardId : localStorage["boardId"]
                });
                break;
            case 'set' :
                if(request.account) localStorage["account"] = request.account;
                if(request.password) localStorage["password"] = request.password;
                if(request.boardId) localStorage["boardId"] = request.boardId;
                get_token(localStorage["account"], localStorage["password"], function(token){
                  if(token){
                    localStorage["token"] = token;
                    sendResponse({token:token});
                  }
                  else{
                    sendResponse();
                  }
                });
                break;
            case 'badge' :
                if(request.number){
                    chrome.browserAction.setBadgeText({text:request.number});
                } else {
                    chrome.browserAction.setBadgeText({text:""});
                }
                sendResponse();
                break;
            default:
                sendResponse();
        }
    }
);

chrome.tabs.onSelectionChanged.addListener(
    function(tabId, selectInfo) 
    {
        chrome.browserAction.setBadgeText({text:""});
        chrome.tabs.get(tabId, function(tab){
            if (tab.url && isSCTUrl(tab.url)) {
                console.log("call sendRequest");
                chrome.tabs.sendRequest(tab.id, {action: "notify"}, 
                    function(response) {
                        console.log("notify finish.");
                    }
                );
            }
        });
    }
);