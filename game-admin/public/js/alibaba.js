/**
 * 阿里巴巴玩法数值测试工具页面
 * author: jxyi
 * date: 2018-1-8
 */

'use strict';

Ext.onReady(function () {
  let betField = Ext.create('Ext.form.field.Text', {
    id: 'betField',
    // xtype: 'textfield',
    name: 'bet',
    labelWidth: 30,
    fieldLabel: 'bet',
    allowBlack: false,
    margin: '8 0 0 10'
  });

  let spinBtn = Ext.create('Ext.button.Button', {
    id: 'langButtonId',
    // xtype: 'button',
    text: 'Change Language',
    handler: doSpin,
    width: 150,
    margin: '10 0 0 10'
  });

  let inputPanel = Ext.create(`Ext.form.FormPanel`, {
    id: 'inputPanel',
    autoShow: true,
    region: 'center',
    renderTo: Ext.getBody(),
    items: [
      betField, spinBtn
    ]
  });



  // let viewPort = new Ext.Viewport({
  //   layout: 'border',
  //   items: []
  // });
});

function doSpin() {

}



