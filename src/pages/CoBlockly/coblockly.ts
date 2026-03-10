/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { blocks } from './blocks/text';
// import { forBlock } from './generators/javascript';
import 'blockly/javascript';
// import { save, load } from './serialization';
import { toolbox } from './toolbox';
import { javascriptGenerator } from 'blockly/javascript';
// import './index.css';

console.log('File B loaded')
// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
//Object.assign(javascriptGenerator.forBlock, forBlock);

// Rule block
// javascriptGenerator['coblock_rule'] =
javascriptGenerator.forBlock['coblock_rule'] = function (block: Blockly.Block) {
  // const ruleName = block.getFieldValue('RULENAME');
  const ruleStart = javascriptGenerator.statementToCode(block, 'RULE_START');
  return `${ruleStart}`.replace(/\(\s+/g, '(');
};

// Transaction block
// javascriptGenerator['coblock_tx'] 
javascriptGenerator.forBlock['coblock_tx'] = function (block: Blockly.Block) {
  const txName = block.getFieldValue('TXNAME');
  const fields = javascriptGenerator.statementToCode(block, 'FIELDS');
  const attrs = javascriptGenerator.statementToCode(block, 'ATTRS');
  const calls = javascriptGenerator.statementToCode(block, 'CALLS');
  
  // TODO gestire il COMP che usi qua
  const mulTxs = block.getFieldValue('tx_card')
  const cfTxs = block.getFieldValue('cf_tx') == "X" ? " dr > 0 seconds " : " r > 0 seconds "
  let textTx = ""
  if (mulTxs > 1)
    for (let i = 0; i < mulTxs; i++) {
      textTx += `${txName}(${fields}${attrs}${calls})`; // append tx
      if (i < (mulTxs - 1))
        textTx += cfTxs // append CF
    }
  else
    textTx += `${txName}(${fields}${attrs}${calls})`;
  return textTx
};

// Field blocks
// javascriptGenerator['coblock_field_contract'] 
javascriptGenerator.forBlock['tx_field_leaf'] = function (block: Blockly.Block) {
  //TODO
  const f = block.getFieldValue('F');
  const comp = block.getFieldValue('COMP');
  const v = block.getFieldValue('VALUE');
  return `${f} ${comp} ${v}`;
};

javascriptGenerator.forBlock['tx_field_logic'] = function (block: Blockly.Block) {
  //TODO
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

/*
javascriptGenerator.forBlock['coblock_field_contract'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const addr = block.getFieldValue('ADDR');
  return `contract ${op} ${addr}`;
};

// javascriptGenerator['coblock_field_block'] 
javascriptGenerator.forBlock['coblock_field_block'] = function (block: Blockly.Block) {
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` block ${comp} ${value}`;
};

// javascriptGenerator['coblock_field_sender'] 
javascriptGenerator.forBlock['coblock_field_sender'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const addr = block.getFieldValue('ADDR');
  return ` sender ${op} ${addr}`;
};

// javascriptGenerator['coblock_field_function'] 
javascriptGenerator.forBlock['coblock_field_function'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const fun = block.getFieldValue('FUN');
  return ` function ${op} ${fun}`;
};

// javascriptGenerator['coblock_field_timestamp']
javascriptGenerator.forBlock['coblock_field_timestamp'] = function (block: Blockly.Block) {
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` timestamp ${comp} ${value}`;
};

// javascriptGenerator['coblock_field_gas'] 
javascriptGenerator.forBlock['coblock_field_gas'] = function (block: Blockly.Block) {
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` gas ${comp} ${value}`;
};
*/

// Attribute blocks
// javascriptGenerator['coblock_attr_sv'] 
javascriptGenerator.forBlock['attr_leaf'] = function (block: Blockly.Block) {
  // TODO
  const a = block.getFieldValue('A');
  const cond = javascriptGenerator.statementToCode(block, 'COND');
  return `${a}(${cond})`;
};

javascriptGenerator.forBlock['attr_logic'] = function (block: Blockly.Block) {
  // TODO
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

javascriptGenerator.forBlock['cond_leaf'] = function (block: Blockly.Block) {
  // TODO
  const name = block.getFieldValue('NAME');
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` ${name} ${comp} ${value}`;
};

javascriptGenerator.forBlock['cond_logic'] = function (block: Blockly.Block) {
  // TODO
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

/*
javascriptGenerator.forBlock['coblock_attr_sv'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const sv = block.getFieldValue('SVNAME');
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` ${op} updated ${sv}(${comp} ${value})`;
};

javascriptGenerator.forBlock['coblock_attr_input'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const inp = block.getFieldValue('INP_NAME');
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` ${op} passed ${inp}(${comp} ${value})`;
};

javascriptGenerator.forBlock['coblock_attr_call'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const call = block.getFieldValue('CALL_ADDR');
  const ca = javascriptGenerator.statementToCode(block, 'CA');
  const i = javascriptGenerator.statementToCode(block, 'I');
  return ` ${op} called ${call}(${ca}${i})`;
};

javascriptGenerator.forBlock['coblock_attr_eventdata'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const ed = block.getFieldValue('ED_NAME');
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` ${op} contained ${ed}(${comp} ${value})`;
};

javascriptGenerator.forBlock['coblock_attr_event'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const ev = block.getFieldValue('EVENT');
  const ed = javascriptGenerator.statementToCode(block, 'ED');
  return ` ${op} emitted ${ev}(${ed})`;
};
*/

javascriptGenerator.forBlock['coblock_call'] = function (block: Blockly.Block) {
  // TODO
  const callName = block.getFieldValue('CALLNAME');
  const fields = javascriptGenerator.statementToCode(block, 'CALLFIELD');
  const attrs = javascriptGenerator.statementToCode(block, 'ATTR');
  const calls = javascriptGenerator.statementToCode(block, 'CALL');
  return `${callName}(${fields}${attrs}${calls})`;
};

javascriptGenerator.forBlock['call_field_leaf'] = function (block: Blockly.Block) {
  // TODO
  const f = block.getFieldValue('F');
  const comp = block.getFieldValue('COMP');
  const v = block.getFieldValue('VALUE');
  return `${f} ${comp} ${v}`;
};

javascriptGenerator.forBlock['call_field_logic'] = function (block: Blockly.Block) {
  // TODO
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

javascriptGenerator.forBlock['call_logic'] = function (block: Blockly.Block) {
  // TODO
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

javascriptGenerator.forBlock['coblock_control_unary'] = function (block: Blockly.Block) {
  const cf = block.getFieldValue('CFU');
  return ` ${cf}`;
};

javascriptGenerator.forBlock['coblock_interval'] = function (block: Blockly.Block) {
  const comp = block.getFieldValue('COMP');
  const v = block.getFieldValue('VALUE');
  const unit = block.getFieldValue('UNIT');
  return ` ${comp} ${v} ${unit}`;
};

javascriptGenerator.forBlock['coblock_control_binary'] = function (block: Blockly.Block) {
  const cf = block.getFieldValue('CFB');
  const ti = javascriptGenerator.statementToCode(block, 'INTERVAL');
  if (ti.length == 0)
    return ` ${cf} > 0 seconds `;  
  return ` ${cf} ${ti} `;
};

// Set up UI elements and inject Blockly
// const codeDiv = document.getElementById('generatedCode')?.firstChild;
// const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');

if (!blocklyDiv) {
  throw new Error(`div with id 'blocklyDiv' not found`);
}
const ws = Blockly.inject(blocklyDiv, { toolbox });

// Register custom blocks/toolbar
var ruleFlyoutCallback = function () {
  var blockList = [
    // 1) Rule container
    {
      kind: 'block',
      type: 'coblock_rule',
    },
    // 2) Transaction pattern
    {
      kind: 'block',
      type: 'coblock_tx',
    }
  ];

  return blockList;
};

// Associates the function with the string 'RULE'
ws.registerToolboxCategoryCallback(
  'RULE', ruleFlyoutCallback);

var fieldsFlyoutCallback = function () {
  var blockList = [
    {
      kind: 'block', type: 'tx_field_leaf'
    },
    {
      kind: 'block', type: 'tx_field_logic'
    },
    /*{
      kind: 'block', type: 'coblock_field_contract'
    },
    {
      kind: 'block', type: 'coblock_field_block'
    },
    {
      kind: 'block', type: 'coblock_field_sender'
    },
    {
      kind: 'block', type: 'coblock_field_function'
    },
    {
      kind: 'block', type: 'coblock_field_timestamp'
    },
    {
      kind: 'block', type: 'coblock_field_gas'
    }*/
  ];

  return blockList;
};

// Associates the function with the string 'RULE'
ws.registerToolboxCategoryCallback(
  'FIELDS', fieldsFlyoutCallback);

var attrsFlyoutCallback = function () {
  var blockList = [
    {
      kind: 'block', type: 'attr_leaf'
    },
    {
      kind: 'block', type: 'attr_logic'
    },
    {
      kind: 'block', type: 'cond_leaf'
    },
    {
      kind: 'block', type: 'cond_logic'
    },
    /*{
      kind: 'block', type: 'coblock_attr_call'
    },
    {
      kind: 'block', type: 'coblock_attr_input'
    },
    {
      kind: 'block', type: 'coblock_attr_sv'
    },
    {
      kind: 'block', type: 'coblock_attr_event'
    },
    {
      kind: 'block', type: 'coblock_attr_eventdata'
    }*/
  ];

  return blockList;
};

// Associates the function with the string 'RULE'
ws.registerToolboxCategoryCallback(
  'ATTRS', attrsFlyoutCallback);

var callsFlyoutCallback = function () {
  var blockList = [
    {
      kind: 'block', type: 'coblock_call'
    },
    {
      kind: 'block', type: 'call_logic'
    },
    {
      kind: 'block', type: 'call_field_leaf'
    },
    {
      kind: 'block', type: 'call_field_logic'
    },
  ];

  return blockList;
};

// Associates the function with the string 'RULE'
ws.registerToolboxCategoryCallback(
  'CALLS', callsFlyoutCallback);

var cfFlyoutCallback = function () {
  var blockList = [
    {
      kind: 'block', type: 'coblock_control_unary'
    },
    // 6) Control-flow: binary
    {
      kind: 'block', type: 'coblock_control_binary'
    },
    {
      kind: 'block', type: 'coblock_interval'
    },
  ];

  return blockList;
};

// Associates the function with the string 'RULE'
ws.registerToolboxCategoryCallback(
  'CF', cfFlyoutCallback);

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
// const runCode = () => {
//   const code = javascriptGenerator.workspaceToCode(ws as Blockly.Workspace);

//   if (codeDiv) codeDiv.textContent = code;

//   if (outputDiv) outputDiv.innerHTML = '';

//   eval(code);
// };

// if (ws) {
//   // Load the initial state from storage and run the code.
//   load(ws);
//   runCode();

//   // Every time the workspace changes state, save the changes to storage.
//   ws.addChangeListener((e: Blockly.Events.Abstract) => {
//     // UI events are things like scrolling, zooming, etc.
//     // No need to save after one of these.
//     if (e.isUiEvent) return;
//     save(ws);
//   });

//   // Whenever the workspace changes meaningfully, run the code again.
//   ws.addChangeListener((e: Blockly.Events.Abstract) => {
//     // Don't run the code when the workspace finishes loading; we're
//     // already running it once when the application starts.
//     // Don't run the code during drags; we might have invalid state.
//     if (
//       e.isUiEvent ||
//       e.type == Blockly.Events.FINISHED_LOADING ||
//       ws.isDragging()
//     ) {
//       return;
//     }
//     runCode();
//   });
// }

// Generate and send rule string
function generateRuleString(): string {
  console.log("Workspace to code")
  console.log('Blockly:', Blockly);
  console.log('Using imported generator:', javascriptGenerator);
  if (javascriptGenerator) {
    const code = javascriptGenerator.workspaceToCode(ws);
    console.log('Generated Code:', code);
    return code;
  } else {
    console.error('javascriptGenerator not loaded');
    return 'javascriptGenerator not loaded';
  }
}

export function sendRuleToBackend() {
  console.log("Retrieving rule from Blockly")
  const rule = generateRuleString();
  console.log('Generated Rule:', rule);

  var divOutput = document.getElementById("outputCoBlockly")
  const textEl = document.createElement('p') as HTMLParagraphElement;
  if (divOutput) {
    divOutput.innerHTML = '';
    textEl.innerText = rule;
    divOutput.appendChild(textEl);
  }

  var divRule = document.getElementById("rule") as HTMLInputElement;
  if (divRule) {
    divRule.value = (rule) ? (rule).trim().replace(/\s+/g, ' ') : "";
  }

  if (divRule.value) {
    const button = document.getElementById('parserButton') as HTMLButtonElement;
    button.click();
  }
  // fetch('/api/rules', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ rule })
  // })
  //   .then(res => res.json())
  //   .then(data => console.log('Server response:', data))
  //   .catch(err => console.error('Error sending rule:', err));
}

// Hook up to a button
// document.getElementById('generateBtn')?.addEventListener('click', sendRuleToBackend);

document.addEventListener('DOMContentLoaded', () => {
  console.log("...adding event listener - COBLOCKLY")
  const button = document.getElementById('generateBtn');
  if (button) {
    button.addEventListener('click', () => {
      console.log('Button clicked!');
      sendRuleToBackend(); // your function
    });
  } else {
    console.error('Button with ID "generateBtn" not found.');
  }
});