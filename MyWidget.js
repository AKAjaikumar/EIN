define("hellow", [
  "UWA/Core",
  "UWA/Drivers/Alone",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI",
  "UWA/Controls/DataGrid",
  "DS/DataDragAndDrop/DataDragAndDrop"
], function (Core, Alone, WAFData, PlatformAPI, DataGrid, DnD) {
	var grid;
  var rowsMap = {};
  var myWidget = {
    onLoadWidget: function () {
		widget.body.innerHTML = "";
		console.log("widget loaded");
		
		console.log("DataGrid loaded:", DataGrid);
		widget.body.empty();

		  grid = new DataGrid({
        className: 'uwa-table',
        columns: [
          {
            key: 'expander',
            text: '',
            width: 30,
            format: function (row) {
              return row.hasChildren ? '<a class="expander" style="cursor:pointer">+</a>' : '';
            }
          },
          { key: 'name', text: 'Name' },
          { key: 'type', text: 'Type' },
          {
            key: 'created',
            text: 'Created On',
            format: function (val) {
              var d = new Date(val);
              return isNaN(d) ? '' : d.toLocaleDateString();
            }
          }
        ],
        data: []
      });

      grid.addEvent('onCellClick', function (cell) {
        if (cell.column.key === 'expander') {
          var row = cell.data;
          if (row._expanded) {
            collapseChildren(row);
          } else {
            expandChildren(row);
          }
        }
      });

      grid.inject(widget.body);

      PlatformAPI.subscribe('DS/DataDragAndDrop/dragEnter', function () {
		  console.log("🟢 dragEnter received");
		});
      DnD.setDnDTarget(widget.body, {
		  acceptedTypes: ['VPMReference'], 
		  drop: function (data) {
			if (!data || !data.items || !data.items.length) return;

			var engItem = data.items[0];
			var pid = engItem.objectId || engItem.physicalId || engItem.id;

			if (!pid) {
			  console.warn("Dropped object has no ID", engItem);
			  return;
			}

			console.log("Dropped:", engItem);
			rowsMap = {};
			fetchChildren(pid, 0, null);
		  }
		});
    }
  };

  function fetchChildren(pid, level, parentRow) {
    WAFData.authenticatedRequest(
      "/resources/v1/modeler/ddseng:EngItem/" + pid + "/dseng:EngInstance", {
        method: "GET",
        type: "json",
        onComplete: function (resp) {
          if (!resp.children) return;
          var children = [];
          resp.children.forEach(child => {
            const row = {
              id: child.id,
              name: child.name,
              type: child.type,
              created: child.created,
              level: level,
              hasChildren: true,
              parentId: parentRow ? parentRow.id : null
            };
            children.push(row);
            rowsMap[child.id] = row;
          });

          if (parentRow) {
            parentRow._expanded = true;
            parentRow._children = children;
            updateDataGrid();
          } else {
            grid.setData(children);
          }
        }
    });
  }

  function expandChildren(row) {
    if (!row._children) {
      fetchChildren(row.id, row.level + 1, row);
    } else {
      row._expanded = true;
      updateDataGrid();
    }
  }

  function collapseChildren(row) {
    row._expanded = false;
    updateDataGrid();
  }

  function updateDataGrid() {
    const result = [];

    function addRowRecursive(row) {
      result.push(row);
      if (row._expanded && row._children) {
        row._children.forEach(addRowRecursive);
      }
    }

    for (let id in rowsMap) {
      const r = rowsMap[id];
      if (!r.parentId) addRowRecursive(r);
    }

    grid.setData(result);
  }

  return myWidget;
});
