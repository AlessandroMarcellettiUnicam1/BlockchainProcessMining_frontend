import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { useColorScheme } from '@mui/material/styles';
import DarkTheme from '@blockly/theme-dark';
import { setupBlocklyEditor, generateRuleStringFromWorkspace } from '../coblockly.ts';

interface CoBlocklyEditorProps {
  onRuleTranslated: (translatedRule: string) => void;
}

export default function CoBlocklyEditor({ onRuleTranslated }: CoBlocklyEditorProps) {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  
  const { mode } = useColorScheme();
  const isDarkMode = mode === 'dark';

  useEffect(() => {
    if (blocklyDivRef.current && !workspaceRef.current) {
      workspaceRef.current = setupBlocklyEditor(blocklyDivRef.current, isDarkMode);
    } else if (workspaceRef.current) {
      
      workspaceRef.current.setTheme(isDarkMode ? DarkTheme : Blockly.Themes.Classic);
      
    }
  }, [isDarkMode]);

  const handleTranslateClick = () => {
    if (workspaceRef.current) {
      const ruleText = generateRuleStringFromWorkspace(workspaceRef.current);
      console.log("Regola generata:", ruleText);
      
      onRuleTranslated(ruleText);
    }
  };

  return (
    <div className="row mb-2">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">CoBlockly</h5>
            </div>
            {/* Bottone React Puro: Nessun ID necessario, usa l'evento onClick */}
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleTranslateClick}
            >
              Translate Rule
            </button>
          </div>

          <div className="card-body p-0">
            {/* L'ancora per Blockly */}
            <div 
              ref={blocklyDivRef} 
              style={{ width: '100%', height: '400px' }}
            ></div>
          </div>

          <div className="card-footer text-muted small">
            Drag and drop blocks to model your rule, then click "Translate Rule" to generate the textual rule
          </div>
        </div>
      </div>
    </div>
  );
}