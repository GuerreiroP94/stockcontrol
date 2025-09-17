// src/components/debug/DebugComponent.tsx
import React, { useState } from 'react';

const DebugComponent: React.FC = () => {
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCompleteDebug = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      step1_environment: {},
      step2_authentication: {},
      step3_connectivity: {},
      step4_endpoints: {},
      step5_createGroup: {}
    };

    try {
      // STEP 1: Environment Check
      console.log('🔍 STEP 1: Environment Check');
      results.step1_environment = {
        url: window.location.href,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        nodeEnv: process.env.NODE_ENV,
        reactAppApiUrl: process.env.REACT_APP_API_URL,
      };
      console.log('Environment:', results.step1_environment);

      // STEP 2: Authentication Check
      console.log('🔍 STEP 2: Authentication Check');
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let user = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error('Erro ao parsear user:', e);
      }

      results.step2_authentication = {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        user: user,
        userRole: user?.role,
        isAdmin: user?.role === 'admin'
      };
      console.log('Authentication:', results.step2_authentication);

      // STEP 3: Connectivity Check
      console.log('🔍 STEP 3: Connectivity Check');
      const apiBaseUrl = 'https://stock-control-backend.onrender.com';
      
      try {
        const healthResponse = await fetch(`${apiBaseUrl}/health`, {
          method: 'GET',
          mode: 'cors'
        });
        
        results.step3_connectivity = {
          healthStatus: healthResponse.status,
          healthOk: healthResponse.ok,
          healthData: healthResponse.ok ? await healthResponse.json() : null
        };
      } catch (error) {
        results.step3_connectivity = {
          error: error instanceof Error ? error.message : 'Unknown error',
          healthStatus: 'FAILED'
        };
      }
      console.log('Connectivity:', results.step3_connectivity);

      // STEP 4: API Endpoints Check
      console.log('🔍 STEP 4: API Endpoints Check');
      const endpoints = [
        '/api/grouphierarchy/full',
        '/api/grouphierarchy/groups',
        '/api/grouphierarchy/devices',
        '/api/grouphierarchy/values',
        '/api/grouphierarchy/packages'
      ];

      results.step4_endpoints = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${apiBaseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });

          const responseText = await response.text();
          let responseData = null;
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = responseText;
          }

          results.step4_endpoints[endpoint] = {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: response.ok ? responseData : null,
            error: !response.ok ? responseData : null
          };
        } catch (error) {
          results.step4_endpoints[endpoint] = {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'NETWORK_ERROR'
          };
        }
      }
      console.log('Endpoints:', results.step4_endpoints);

      // STEP 5: Test Group Creation
      console.log('🔍 STEP 5: Test Group Creation');
      const testGroupName = `Debug_Test_${Date.now()}`;
      
      try {
        const createResponse = await fetch(`${apiBaseUrl}/api/grouphierarchy/groups`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({ name: testGroupName })
        });

        const responseText = await createResponse.text();
        let responseData = null;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = responseText;
        }

        results.step5_createGroup = {
          request: {
            url: `${apiBaseUrl}/api/grouphierarchy/groups`,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token?.substring(0, 20)}...`,
              'Content-Type': 'application/json'
            },
            body: { name: testGroupName }
          },
          response: {
            status: createResponse.status,
            ok: createResponse.ok,
            statusText: createResponse.statusText,
            headers: Object.fromEntries(createResponse.headers.entries()),
            data: responseData
          }
        };

        if (createResponse.ok) {
          console.log('✅ Group creation successful!', responseData);
        } else {
          console.error('❌ Group creation failed:', {
            status: createResponse.status,
            data: responseData
          });
        }

      } catch (error) {
        results.step5_createGroup = {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null
        };
        console.error('❌ Group creation error:', error);
      }

    } catch (error) {
      console.error('❌ Debug process error:', error);
      results.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      setLoading(false);
      setDebugResults(results);
      
      // Salvar resultados no console para análise
      console.log('🔍 COMPLETE DEBUG RESULTS:', results);
    }
  };

  const downloadDebugReport = () => {
    if (!debugResults) return;
    
    const blob = new Blob([JSON.stringify(debugResults, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '20px',
      zIndex: 9999,
      fontSize: '12px',
      overflow: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
        🔧 Debug Complete
      </h3>

      <button
        onClick={runCompleteDebug}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '15px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {loading ? '⏳ Analisando...' : '🔍 Executar Análise Completa'}
      </button>

      {debugResults && (
        <>
          <button
            onClick={downloadDebugReport}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '15px',
              fontSize: '12px'
            }}
          >
            📥 Baixar Relatório Completo
          </button>

          <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
            <h4>📊 Resultados da Análise:</h4>
            
            {/* Step 1: Environment */}
            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>1. Environment:</strong>
              <div>URL: {debugResults.step1_environment?.hostname}</div>
              <div>API URL: {debugResults.step1_environment?.reactAppApiUrl || 'Não definida'}</div>
            </div>

            {/* Step 2: Authentication */}
            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: debugResults.step2_authentication?.isAdmin ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
              <strong>2. Authentication:</strong>
              <div>Token: {debugResults.step2_authentication?.hasToken ? '✅' : '❌'}</div>
              <div>Role: {debugResults.step2_authentication?.userRole || 'Não definida'}</div>
              <div>Is Admin: {debugResults.step2_authentication?.isAdmin ? '✅' : '❌'}</div>
            </div>

            {/* Step 3: Connectivity */}
            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: debugResults.step3_connectivity?.healthOk ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
              <strong>3. Connectivity:</strong>
              <div>Health: {debugResults.step3_connectivity?.healthStatus}</div>
              {debugResults.step3_connectivity?.error && (
                <div style={{ color: 'red' }}>Erro: {debugResults.step3_connectivity.error}</div>
              )}
            </div>

            {/* Step 4: Endpoints */}
            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>4. Endpoints:</strong>
              {Object.entries(debugResults.step4_endpoints || {}).map(([endpoint, result]: [string, any]) => (
                <div key={endpoint} style={{ marginLeft: '10px' }}>
                  <span style={{ color: result.ok ? 'green' : 'red' }}>
                    {result.ok ? '✅' : '❌'}
                  </span>
                  {endpoint}: {result.status}
                </div>
              ))}
            </div>

            {/* Step 5: Group Creation */}
            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: debugResults.step5_createGroup?.response?.ok ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
              <strong>5. Group Creation Test:</strong>
              {debugResults.step5_createGroup?.response ? (
                <>
                  <div>Status: {debugResults.step5_createGroup.response.status}</div>
                  <div>Success: {debugResults.step5_createGroup.response.ok ? '✅' : '❌'}</div>
                  {debugResults.step5_createGroup.response.data && (
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>
                      Resposta: {JSON.stringify(debugResults.step5_createGroup.response.data, null, 1)}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'red' }}>
                  Erro: {debugResults.step5_createGroup?.error}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DebugComponent;