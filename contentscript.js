/**
 * Content script
 */
var count = 0;
var retry = true;

function _putNote() {
	localStorage["text"] = $(this).parents("article").children(".content-body").text();
    retry = true;
	//chrome.extension.sendRequest({action: "get"}, function(response) {
    chrome.extension.sendMessage({action: "get"}, function(response) {
		//console.log(response);
		putNote(response);
	});
	$(this).slideUp();

    return false;
}

function putNote(param) {
	var color = ["yellow", "white", "pink", "blue", "green"];
	var account = param.account;
	var token = param.token;
	var boardId = param.boardId;
    // POST送信
    $.ajax(
    {
        type:"POST",
        url:"https://hotate-stg.bob.iiji.jp:4000/api/boards/add",
        data: 
        {
            token: token,
            accessKey: account + "@iij.ad.jp",
            boardId: boardId,
            text: localStorage["text"],
            top: (count % 5) * 128,
            left: Math.floor(count / 5) * 128,
            width: 120,
            height: 120,
            color: color[count % 5]
        },
        dataType:"json",
        success: function(res) {
            switch(res.code) {
            // 成功した場合はcode200と機能に応じたデータを返す。
            case 200:
                msg = res.message;
                break;
            // 失敗した場合はcode200以外とmessage, detailを返す。
            default:
                msg = res.message + "(" + res.detail + ")";
                if(retry){
                    retry = false;
                    //chrome.extension.sendRequest({action: "set"}, function(response) {
                    chrome.extension.sendMessage({action: "set"}, function(response) {
                        putNote(response);
                    });
                }
                break;
            }
            console.log(msg);
        },
        error: function(req, status, errorThrown) {
            console.log(status);
        }
    });

    count++;
    localStorage["text"] = "";

    updateBadge();
}

function insertLink() {
	$(".message .content-body").each(function () {
		var parent = $(this).parent();
		if(parent.attr("insertedLink")) return true;
        var element = document.createElement("A");
        var iElement = document.createElement("I");
        $(iElement).addClass("ico-nav-reply");
        $(element).append(iElement);
		$(element).append(document.createTextNode("Put note"));
		$(element).click(_putNote);
        parent.children("footer").children("nav").append(element);
		parent.attr("insertedLink", "true");
	});
}

localStorage['timer'] = "";
function insertLinkTimer() {
	var timer = localStorage['timer'];
	if(timer) return;
	localStorage['timer'] = setTimeout(function() {
		insertLink();
		localStorage['timer'] = "";
	}, 300);
}

document.addEventListener('DOMNodeInserted', function(e){
    //console.log('***DOMNodeInserted:' + e.srcElement.constructor.name);
    insertLinkTimer();
});
document.addEventListener('DOMSubtreeModified', function(e){
    //console.log('***DOMSubtreeModifed:' + e.srcElement.constructor.name);
    insertLinkTimer();
});

$("body header h1").click(function (){
    $("html,body").animate({ scrollTop: 0 }, 'slow');
});
$("body header h1").css("cursor", "pointer");

function updateBadge() {
    //chrome.extension.sendRequest({action: "badge", number: count.toString()}, function(response) {
    chrome.extension.sendMessage({action: "badge", number: count.toString()}, function(response) {
        console.log(response);
    });
}
updateBadge();

//chrome.extension.onRequest.addListener(
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) 
    {
        switch(request.action) 
        {
            case 'notify' :
                updateBadge();
                sendResponse();
                break;
            default:
                sendResponse();
        }
    }
);

function scrollFloatWindow(event, delta) {
    if(delta > 0 && $(this).scrollTop() <= 0){
        return false;
    } else if(delta < 0 && $(this).scrollTop() + $(this).height() >= $(this).get(0).scrollHeight){
        return false;
    }
    console.log($(this).scrollTop() + $(this).height() + '/' + $(this).get(0).scrollHeight);
}
$(".conversation header").mousewheel(function(event, delta) { return false; });
$(".conversation .post-form").mousewheel(function(event, delta) { return false; });
$(".conversation .stream-items").mousewheel(scrollFloatWindow);
$(".profile header").mousewheel(function(event, delta) { return false; });
$(".profile .user-card").mousewheel(function(event, delta) { return false; });
$(".profile .stream-items").mousewheel(scrollFloatWindow);