import React, { useState } from 'react';
import * as nearley from 'nearley';
import grammar from '../grammar'; 
import { interpretRule as ir } from '../parser'; 

interface RuleParserProps {
  ruleText: string;
  setRuleText: (text: string) => void; 
  onRuleParsed: (parsedResult: string | null) => void; 
}

export default function RuleParser({ ruleText, setRuleText, onRuleParsed }: RuleParserProps) {

  const [alertMsg, setAlertMsg] = useState<{ text: string, type: 'success' | 'warning' | 'danger' } | null>(null);

  const handleParse = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 

    console.log("Verifying rule with parser...");


    if (ruleText.trim().length === 0) {
      setAlertMsg({ text: 'Please insert a rule to compile!', type: 'danger' });
      onRuleParsed(null);
      return;
    }

    try {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
      parser.feed(ruleText);

      if (parser.results.length > 0) {

        const parsedObject = ir(parser.results[0]);

        const parserResultString = JSON.stringify(parsedObject, null, 2);
        
        console.log(parserResultString);
        
        setAlertMsg({ text: `Rule "${ruleText}" successfully compiled!`, type: 'success' });
        onRuleParsed(parserResultString);
      } else {
        setAlertMsg({ text: `Rule "${ruleText}" correct so far, but incomplete!`, type: 'warning' });
        onRuleParsed(null);
      }
    } catch (error) {
      console.error(error);
      setAlertMsg({ text: String(error), type: 'danger' });
      onRuleParsed(null);
    }
  };

  return (
    <div className="row mb-2">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">CoBlock</h5>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="mb-1">
              <label htmlFor="rule" className="form-label fw-semibold d-flex align-items-center">
                <span>Textual Rule</span>
              </label>
              
              {/* Agganciamo la funzione di parsing al form */}
              <form onSubmit={handleParse}>
                <div className="input-group mb-3">
                  <input 
                    id="rule" 
                    type="text" 
                    className="form-control form-control-lg"
                    placeholder="e.g., tx1(function == approveOrder AND sender == 0x123) occ"
                    value={ruleText} 
                    onChange={(e) => setRuleText(e.target.value)} 
                  />
                  <button type="submit" className="btn btn-primary px-4">
                    Parse Rule
                  </button>
                </div>
              </form>
            </div>
            
            {/* Banner Dinamico: Appare solo se c'è un messaggio */}
            {alertMsg && (
              <div className={`alert alert-${alertMsg.type} p-2 overflow-auto`} style={{ maxHeight: '200px' }}>
                {alertMsg.type === 'danger' ? (
                   <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{alertMsg.text}</pre>
                ) : (
                   alertMsg.text
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}