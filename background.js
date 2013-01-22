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
chrome.extension.onMessage.addListener(
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
                //if(request.number){
                //    chrome.browserAction.setBadgeText({text:request.number});
                //} else {
                //    chrome.browserAction.setBadgeText({text:""});
                //}
                sendResponse();
                break;
            case 'open' :
                openWebSocket("ws://localhost:8080");
                sendResponse();
                break;
            case 'close' :
                ws.onclose();
                sendResponse();
                break;
            case 'login' :
                loginIMAP(request.mailServer, request.mailAddress, request.password);
                sendResponse();
                break;
            case 'logout' :
                logoutIMAP();
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
        //chrome.browserAction.setBadgeText({text:""});
        chrome.tabs.get(tabId, function(tab){
            if (tab.url && isSCTUrl(tab.url)) {
                console.log("call sendRequest");
                chrome.tabs.sendMessage(tab.id, {action: "notify"}, 
                    function(response) {
                        console.log("notify finish.");
                    }
                );
            }
        });
    }
);

var ws = {};
function openWebSocket(url){
    if(!$.isEmptyObject(ws)) {
        ws.onclose();
    }
    ws = new WebSocket(url);
    ws.onopen = function (e) {
        console.log('onopen')
    };
    ws.onclose = function (e) {
        console.log('onclose')
    };
    ws.onmessage = function (e) {
        console.log(e.data)
        var message = $.parseJSON(e.data)
        if(message.method == "unseen"){
            if(message.count && message.count != 0){
                chrome.browserAction.setBadgeText({text:(message.count).toString()});
            } else {
                chrome.browserAction.setBadgeText({text:""});
            }
        }
    };
    ws.onerror = function () {
        console.log('onerror')
    };
};
function send(data) {
    console.log('call send/' + data)
    if (data) {
        ws.send(data);
    }
};
function loginIMAP(mailServer, mailAddress, password) {
    send('{"method":"login", "mailServer":"' + mailServer + '", "mailAddress":"' + mailAddress + '", "password":"' + password + '"}');
};
function logoutIMAP() {
    send('{"method":"logout"}');
};