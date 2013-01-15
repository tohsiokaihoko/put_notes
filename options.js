function get_token(account, password) {
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
                // 成功した場合はcode200と機能に応じたデータを返す。
                case 200:
                    msg = res.detail.token;
                    localStorage["token"] = msg;
                    var now = new Date();
                    var strNow = now.getFullYear() + "/" + (now.getMonth() + 1) + "/" + now.getDate();
                    localStorage["date"] = strNow;
                    $("#txtDate").text(strNow);
                    disply_success();
                    //alert("Options saved.");
                    break;
                // 失敗した場合はcode200以外とmessage, detailを返す。
                default:
                    msg = res.message + "(" + res.detail + ")";
                    disply_error1(msg);
                    //alert(msg);
                    break;
            }
            console.log(msg);
        },
        error: function(req, status, errorThrown) {
            console.log("get_token error/" + errorThrown);
            disply_error2();
            //alert("get_token error/" + errorThrown);
        }
    });
}

// Save options to localStorage		
function save_options() {
	// Account
	var account = $("#txtAccount").val();
	localStorage["account"] = account;

	// Password
	var password = $("#txtPassword").val();
	localStorage["password"] = password;

	// BoardId
	var boardId = $("#txtBoardId").val();
	localStorage["boardId"] = boardId;

	get_token(account, password);
}

// Restores options from localStorage
function restore_options() {
	var account = localStorage["account"];
	if (account) {
		$("#txtAccount").val(account);
	}
	var password = localStorage["password"];
	if (password) {
		$("#txtPassword").val(password);
	}
	var boardId = localStorage["boardId"];
	if (boardId) {
		$("#txtBoardId").val(boardId);
	}
    var date = localStorage["date"];
    if (date) {
        $("#txtDate").text(date);
    }
}

$(document).ready(restore_options);
$("#btnSave").click(save_options);
$("#btnUpdate").click(save_options);
$("#btnCancel").click(function(){
    chrome.tabs.getSelected(undefined, function(tab){
        chrome.tabs.remove(tab.id);
    });
});

function disply_message(style, label, message) {
    /*
     * <div class="span4 offset2 alert alert-success">
     *  <button type="button" class="close" data-dismiss="alert">&times;</button>
     *  <strong>Success!</strong> You get token.
     * </div>
     */
    var div = document.createElement("DIV");
    var button = document.createElement("BUTTON");
    var strong = document.createElement("STRONG");
    $(div).addClass("span4 offset2 alert " + style);
    $(button).addClass("close");
    $(button).attr("type", "button");
    $(button).attr("data-dismiss", "alert");
    $(button).text("×");
    $(strong).text(label);
    $(div).append(button);
    $(div).append(strong);
    $(div).append(document.createTextNode(" " + message));
    $("#messageDiv").empty();
    $("#messageDiv").append(div);
}

function disply_success() {
    disply_message("alert-success", "Success!", "You get token.");
}
function disply_error1(message) {
    disply_message("", "Error!", message);
}
function disply_error2() {
    disply_message("alert-error", "Error!", "Network error.");
}

