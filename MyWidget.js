require([
  'UWA/Core',
  'UWA/Drivers/Alone',
  'DS/DataGridView/DataGridView',
  'DS/WAFData/WAFData',
  'DS/PlatformAPI/PlatformAPI'
], function (UWA, Alone, DataGridView, WAFData, PlatformAPI) {
  'use strict';
  if (typeof widget !== 'undefined') {
        widget.addEvent('onLoad', function () {
			 console.log("Widget Loaded");
			var container = document.getElementById('product-grid');
		});
    } else {
        console.error('Widget object is not available');
    }

});
