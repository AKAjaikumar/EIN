define("hellow", [
  "UWA/Core",
  "UWA/Drivers/Alone",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI",
  "DS/Tree/Tree"
], function (Core, Alone, WAFData, PlatformAPI, Tree) {
  var myWidget = {
    onLoadWidget: function () {
		widget.body.innerHTML = "";
		console.log("widget loaded");
		
		console.log("Tree loaded:", Tree);
		
    }
  };

  return myWidget;
});
