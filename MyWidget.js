define("hellow", ["UWA/Core",
  "UWA/Drivers/Alone",
  "DS/DataGridView/DataGridView",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI"], function (Core, Alone, DataGridView, WAFData,PlatformAPI) {
	   var myWidget = {
			onLoadWidget: function () {
				consoel.log("WIdget Loaded");
				widget.body.innerHTML = "";
				
			}
		    return myWidget;
			
		};
	
});
