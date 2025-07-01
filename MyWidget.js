require([
  'UWA/Core',
  'UWA/Drivers/Alone',
  'DS/DataGridView/DataGridView',
  'DS/WAFData/WAFData',
  'DS/PlatformAPI/PlatformAPI',
  'DS/WidgetServices/WidgetServices'
], function (UWA, Alone, DataGridView, WAFData, PlatformAPI, WidgetServices) {
  'use strict';

  var container = document.getElementById('product-grid');
  var gridView;

  function fetchChildrenRecursive(parentId, level = 0) {
    return new Promise((resolve) => {
      WAFData.authenticatedRequest(
        `/resources/v1/modeler/dsbom/getchildren?parentPhysicalId=${parentId}&depth=1`,
        {
          method: 'GET',
          type: 'json',
          onComplete: async function (data) {
            if (!data.children || data.children.length === 0) {
              resolve([]);
              return;
            }

            const flatList = [];
            for (const child of data.children) {
              flatList.push({
                id: child.id,
                name: child.name,
                type: child.type,
                level: level + 1
              });
              const subChildren = await fetchChildrenRecursive(child.id, level + 1);
              flatList.push(...subChildren);
            }
            resolve(flatList);
          },
          onFailure: function () {
            resolve([]);
          }
        }
      );
    });
  }

  function handleDrop(objects) {
    if (!objects || objects.length === 0) return;

    const droppedObj = objects[0];
    const physicalId = droppedObj.objectId;

    WAFData.authenticatedRequest(
      `/resources/v1/modeler/dsbom/getroot?physicalId=${physicalId}`,
      {
        method: 'GET',
        type: 'json',
        onComplete: async function (data) {
          const root = data.root;
          const structure = [{
            id: root.id,
            name: root.name,
            type: root.type,
            level: 0
          }];

          const children = await fetchChildrenRecursive(root.id, 0);
          structure.push(...children);
          populateGrid(structure);
        }
      }
    );
  }

  function populateGrid(data) {
    if (gridView) {
      gridView.destroy();
    }

    gridView = new DataGridView({
      columns: [
        { text: 'Name', dataIndex: 'name', width: 300 },
        { text: 'Type', dataIndex: 'type' },
        { text: 'Level', dataIndex: 'level' }
      ],
      data: data,
      treeView: true,
      treeViewConfig: {
        idAttribute: 'id',
        parentAttribute: 'parentId', // optional if flat
        levelAttribute: 'level'
      }
    });

    gridView.inject(container);
  }

  WidgetServices.getDragAndDropHandler({
    onDrop: handleDrop
  });

});
