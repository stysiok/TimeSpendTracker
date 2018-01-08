var uniqueUrls = [];


//--Chrome Extension section
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(changeInfo.status !== "complete")
        return;
    
    console.log("Tab has been updated");
    //console.log(tab);
    addUniqueUrl(tab.url);
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    if(activeInfo.tabId == "")
        return;

    getCurrentSelectedTab(activeInfo.tabId);
});

function getCurrentSelectedTab(tabId){
    chrome.tabs.get(tabId, function(tab) {
        console.log("selected tab changed");
        //console.log(tab);
        addUniqueUrl(tab.url);
    });
}

//--functions of URLs
function urlParser(url){
    var element = document.createElement('a');
    element.href = url;

    var hostname = element.hostname;
    console.log(hostname);

    return hostname;
}

function addUniqueUrl(url){
    var parsedUrl = urlParser(url);

    if(uniqueUrls.indexOf(parsedUrl) === -1){
        uniqueUrls.push(parsedUrl);
        console.log(`Url is unique and has been added to array (${parsedUrl})`);
    }
    else{
        console.log(`Url isn't unique. (${parsedUrl})`);
    }
}

function showAllUniqueUrls(){
    uniqueUrls.forEach(element => {
        console.log(element);
    });
}