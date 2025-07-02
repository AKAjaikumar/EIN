define("hellow", [
  "UWA/Core",
  "UWA/Drivers/Alone",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI",
  "UWA/Controls/DataGrid",
  "DS/DataDragAndDrop/DataDragAndDrop",
  "DS/i3DXCompassServices/i3DXCompassServices"
], function (Core, Alone, WAFData, PlatformAPI, DataGrid, DataDnD, i3DXCompassServices) {
  var grid;
  var rowsMap = {};
  var platformId;

  var myWidget = {
    onLoadWidget: function () {
      widget.body.innerHTML = "";
      console.log("widget loaded");
      platformId = widget.getValue("x3dPlatformId");
      console.log("platformId:", platformId);
      widget.body.empty();
      widget.body.setStyle("border", "2px dashed #666");
      widget.body.setStyle("padding", "20px");
      widget.body.setText("Drag a Physical Product here");

      //createGrid([]);

      DataDnD.droppable(widget.body, {
        enter: function (el, event) {
          if (el && el.classList) el.classList.add("drag-over");
        },
        over: function (el, event) {
          return true;
        },
        leave: function (el, event) {
          if (el && el.classList) el.classList.remove("drag-over");
        },
        drop: function (dropData, el, event) {
          if (el && el.classList) el.classList.remove("drag-over");

          try {
            const parsed = typeof dropData === 'string' ? JSON.parse(dropData) : dropData;
            console.log("Dropped Data:", parsed);

            const engItem = parsed?.data?.items?.[0];
            console.log("engItem:", engItem);

            const pid = engItem?.physicalId || engItem?.objectId || engItem?.id;
            console.log("pid:", pid);

            if (!pid) {
              console.warn("No valid ID found in drop:", engItem);
              return;
            }
			const rootRow = {
			  id: pid,
			  name: engItem?.displayName || "Root",
			  type: engItem?.objectType || "VPMReference",
			  created: engItem?.created || new Date().toISOString(),
			  level: 0,
			  hasChildren: true,
			  _expanded: false,
			  parentId: null
			};
            console.log("Dropped PhysicalProduct ID:", pid);
			rowsMap[pid] = rootRow;
            createGrid([]);
			
			fetchChildren(pid, 1, rootRow, function () {
			  updateDataGrid(); 
			});


          } catch (e) {
            console.error("\u274c Failed to parse dropped data:", e);
          }
        }
      });
    }
  };

  function createGrid(data) {
  if (grid) grid.destroy();

  grid = new DataGrid({
    className: 'uwa-table',
    columns: [
      {
        key: 'expandcol',
        text: '',
        width: 30,
        type: 'html',
        dataIndex: '',
        format: function (val, row) {
			console.log("row:",row);
			console.log("val:",val);
		  if (!row || typeof row !== 'object') {
			console.warn('Row is undefined or not an object:', row);
			return '';
		  }
		  if (!row.hasChildren) return ''; 
		  const symbol = row._expanded ? '−' : '+';
		  return `<div class="expander" data-rowid="${row.id}" style="cursor:pointer">${symbol}</div>`;
		}
      },
      {
        key: 'name',
        text: 'Name',
        dataIndex: 'name',
        format: function (val, row) {
           const indent = (row && typeof row.level === 'number') ? row.level * 20 : 0;
          return `<div style="margin-left:${indent}px">${val || ''}</div>`;
        }
      },
      { key: 'type', text: 'Type', dataIndex: 'type' },
      {
        key: 'created',
        text: 'Created On',
        dataIndex: 'created',
        format: function (val, row) {
          const d = new Date(val);
          return isNaN(d) ? '' : d.toLocaleDateString();
        }
      }
    ],
    data: data
  });

  widget.body.empty();
  grid.inject(widget.body);
  widget.body.addEventListener('click', function (e) {
  const target = e.target;
  if (target && target.classList.contains('expander')) {
    const rowId = target.getAttribute('data-rowid');
    if (!rowId) return;

    const row = rowsMap[rowId];
    if (!row) return;

    console.log("Expander clicked:", row);

    if (row._expanded) {
      collapseChildren(row);
    } else {
      expandChildren(row);
    }
  }
});
}


  function fetchChildren(pid, level, parentRow, callback) {
	  console.log("Fetched children for", pid, parentRow);
    i3DXCompassServices.getServiceUrl({
      platformId: widget.getValue("x3dPlatformId"),
      serviceName: "3DSpace",
      onComplete: function (URL3DSpace) {
        let baseUrl = typeof URL3DSpace === "string" ? URL3DSpace : URL3DSpace[0].url;
        if (baseUrl.endsWith("/3dspace")) baseUrl = baseUrl.replace("/3dspace", "");

        const csrfURL = baseUrl + "/resources/v1/application/CSRF";

        WAFData.authenticatedRequest(csrfURL, {
          method: "GET",
          type: "json",
          onComplete: function (csrfData) {
            const csrfToken = csrfData.csrf.value;
            const csrfHeader = csrfData.csrf.name;

            const postUrl = baseUrl + "/cvservlet/progressiveexpand/v2?tenant=" + platformId + "&output_format=cvjson";

            const postData = {
              batch: {
                expands: [{
                  aggregation_processors: [{
                    truncate: {
                      max_distance_from_prefix: 1,
                      prefix_filter: {
                        prefix_path: [{ physical_id_path: [pid] }]
                      }
                    }
                  }],
                  filter: {
                    and: {
                      filters: [
                        {
                          prefix_filter: {
                            prefix_path: [{ physical_id_path: [pid] }]
                          }
                        },
                        {
                          and: {
                            filters: [{
                              sequence_filter: {
                                sequence: [{
                                  uql: '((flattenedtaxonomies:"reltypes/VPMInstance") OR (flattenedtaxonomies:"reltypes/VPMRepInstance") OR (flattenedtaxonomies:"reltypes/SpecificationDocument")) AND (NOT (ds6wg_58_synchroebomext_46_v_95_inebomuser:"FALSE"))'
                                }]
                              }
                            }]
                          }
                        }
                      ]
                    }
                  },
                  graph: {
                    descending_condition_object: {
                      uql: '(flattenedtaxonomies:"types/Drawing") OR ds6w_58_globaltype:"ds6w:Part" OR (flattenedtaxonomies:"types/Document") OR (flattenedtaxonomies:"types/CONTROLLED DOCUMENTS")'
                    },
                    descending_condition_relation: {
                      uql: 'NOT (flattenedtaxonomies:"reltypes/XCADBaseDependency") AND ((flattenedtaxonomies:"reltypes/VPMInstance") OR (flattenedtaxonomies:"reltypes/VPMRepInstance") OR (flattenedtaxonomies:"reltypes/SpecificationDocument"))'
                    }
                  },
                  label: "expand-root-" + Date.now(),
                  root: {
                    physical_id: pid
                  }
                }]
              },
              outputs: {
                format: "entity_relation_occurrence",
                select_object: ["ds6w:label", "ds6w:created", "type", "physicalid"],
                select_relation: ["ds6w:type", "type", "physicalid"]
              }
            };

            WAFData.authenticatedRequest(postUrl, {
              method: "POST",
              type: "json",
              headers: {
                "Content-Type": "application/json",
                'SecurityContext': 'VPLMProjectLeader.Company Name.APTIV INDIA',
                [csrfHeader]: csrfToken
              },
              data: JSON.stringify(postData),
              onComplete: function (resp) {
                const children = [];
				const results = resp.results || [];


				const objectMap = {};
				results.forEach(item => {
				  if (item.type === "VPMReference") {
					objectMap[item.resourceid] = item;
				  }
				});

				results.forEach(item => {
				  if (item.type === "VPMInstance" && item.from === pid) {
					const childObj = objectMap[item.to];
					if (childObj) {
					  const row = {
						id: childObj.resourceid,
						name: childObj["ds6w:label"],
						type: childObj["type"],
						created: childObj["ds6w:created"],
						level: level,
						hasChildren: true,
						_expanded: true,
						expandcol: '', 
						parentId: parentRow ? parentRow.id : null
					  };
					  children.push(row);
					  rowsMap[childObj.resourceid] = row;
					}
				  }
				});

                parentRow._children = children;
              parentRow._expanded = true;

              // Recursive expansion with counter
              let remaining = children.length;
              if (remaining === 0) {
                callback && callback();
              } else {
                children.forEach(child => {
                  fetchChildren(child.id, child.level + 1, child, function () {
                    remaining--;
                    if (remaining === 0) {
                      callback && callback();
                    }
                  });
                });
              }
              },
              onFailure: function (err) {
                console.error("Failed to fetch structure from progressiveexpand:", err);
              }
            });
          },
          onFailure: function (err) {
            console.error("Failed to fetch CSRF token:", err);
          }
        });
      },
      onFailure: function () {
        console.error("Failed to get 3DSpace URL");
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

  Object.values(rowsMap).forEach((row) => {
    if (!row.parentId) addRowRecursive(row);
  });

 createGrid(result); 
}



  return myWidget;
});
