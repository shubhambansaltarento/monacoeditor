

const Newtest = () => {

    const JUDGE0_LOCAL_URL = 'http://localhost:2358';

    async function pollSubmissionResult(token, maxAttempts = 20, interval = 1000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions/${token}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Check submission status
            // Status IDs: 1 = In Queue, 2 = Processing, 3+ = Completed
            if (result.status.id <= 2) {
                console.log(`Attempt ${attempts + 1}: Status = ${result.status.description}`);
                await sleep(interval);
                attempts++;
                continue;
            }
            
            // Submission completed
            console.log('Submission completed!');
            console.log('Submission completed!', result);
            return parseSubmissionResult(result);
            
        } catch (error) {
            console.error(`Polling error (attempt ${attempts + 1}):`, error);
            attempts++;
            await sleep(interval);
        }
    }
    
    throw new Error('Polling timeout - submission may still be processing');
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseSubmissionResult(result) {
    const output = {
        token: result.token,
        status: result.status.description,
        statusId: result.status.id,
        stdout: result.stdout ? atob(result.stdout) : null,
        stderr: result.stderr ? atob(result.stderr) : null,
        compileOutput: result.compile_output ? atob(result.compile_output) : null,
        time: result.time,
        memory: result.memory,
        exitCode: result.exit_code,
        exitSignal: result.exit_signal
    };
    
    // Determine if successful
    output.success = result.status.id === 3; // Accepted
    
    // Get final output text
    if (output.success) {
        output.finalOutput = output.stdout || 'No output';
    } else if (result.status.id === 6) {
        // Compilation error
        output.finalOutput = `Compilation Error:\n${output.compileOutput}`;
    } else if (result.status.id >= 7 && result.status.id <= 12) {
        // Runtime error
        output.finalOutput = `Runtime Error: ${output.status}\n${output.stderr || ''}`;
    } else {
        output.finalOutput = `Error: ${output.status}`;
    }
    
    return output;
}

// 1. CREATE SUBMISSION API
async function createSubmission(sourceCode, languageId, stdin = '') {
    const submissionData = {
        source_code: btoa(sourceCode), // Base64 encode
        language_id: languageId,
        // stdin: btoa(stdin),
        // // Optional parameters
        // expected_output: null,
        // cpu_time_limit: 2,
        // memory_limit: 128000,
        // wall_time_limit: 5,
        // compiler_options: null,
        // command_line_arguments: null
    };

    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Submission created:', result);
        return result.token;
    } catch (error) {
        console.error('Error creating submission:', error);
        return null;
    }
}

// 2. GET SUBMISSION RESULT API
async function getSubmissionResult(token) {
    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const submitResult = await response.json();

        const result = await pollSubmissionResult(submitResult.token);
        console.log('Final result:', result);
        console.log('Submission result:', result);
        return result;
    } catch (error) {
        console.error('Error getting submission result:', error);
        return null;
    }
}

// 3. GET SUBMISSION WITH WAIT (Blocking until completion)
async function getSubmissionWithWait(token, maxWaitTime = 1000) {
    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions/${token}?wait=true&max_wait_time=${maxWaitTime}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Submission result (with wait):', result);
        return result;
    } catch (error) {
        console.error('Error getting submission result with wait:', error);
        return null;
    }
}

// 4. BATCH SUBMISSIONS API
async function createBatchSubmissions(submissions) {
    const batchData = {
        submissions: submissions.map(sub => ({
            source_code: btoa(sub.source_code),
            language_id: sub.language_id,
            stdin: btoa(sub.stdin || ''),
            expected_output: sub.expected_output || null
        }))
    };

    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(batchData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Batch submissions created:', result);
        return result;
    } catch (error) {
        console.error('Error creating batch submissions:', error);
        return null;
    }
}

// 5. GET BATCH RESULTS API
async function getBatchResults(tokens) {
    const tokenString = tokens.join(',');
    
    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions/batch?tokens=${tokenString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Batch results:', result);
        return result;
    } catch (error) {
        console.error('Error getting batch results:', error);
        return null;
    }
}

// 6. GET LANGUAGES API
async function getLanguages() {
    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/languages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Available languages:', result);
        return result;
    } catch (error) {
        console.error('Error getting languages:', error);
        return null;
    }
}

// 7. GET SYSTEM INFO API
async function getSystemInfo() {
    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/system_info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('System info:', result);
        return result;
    } catch (error) {
        console.error('Error getting system info:', error);
        return null;
    }
}

// 8. DELETE SUBMISSION API
async function deleteSubmission(token) {
    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions/${token}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Submission deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting submission:', error);
        return false;
    }
}

// EXAMPLE USAGE FUNCTIONS

// Example 1: Simple Java Hello World
async function testJavaHelloWorld() {
    console.log('=== Testing Java Hello World ===');
    
//     const javaCode = `
// public class Main {
//     public static void main(String[] args) {
//         System.out.println("Hello, World!");
//     }
// }`;

const javaCode = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

    const token = await createSubmission(javaCode, 4); // Java language ID
    if (token) {
        // Wait a bit then get result
        setTimeout(async () => {
            const result = await getSubmissionResult(token);
            if (result && result.stdout) {
                console.log('Output:', atob(result.stdout));
            }
        }, 2000);
    }
}

// Example 2: Java with input
async function testJavaWithInput() {
    console.log('=== Testing Java with Input ===');
    
    const javaCode = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String name = scanner.nextLine();
        System.out.println("Hello, " + name + "!");
        scanner.close();
    }
}`;

    const stdin = "John Doe";
    const token = await createSubmission(javaCode, 4, stdin);
    if (token) {
        // Use wait API for immediate result
        const result = await getSubmissionWithWait(token, 5);
        if (result && result.stdout) {
            console.log('Output:', atob(result.stdout));
        }
    }
}

// Example 3: Test compilation error
async function testCompilationError() {
    console.log('=== Testing Compilation Error ===');
    
    const javaCode = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World"  // Missing semicolon and closing parenthesis
    }
}`;

    const token = await createSubmission(javaCode, 62);
    if (token) {
        const result = await getSubmissionWithWait(token, 5);
        if (result && result.compile_output) {
            console.log('Compilation Error:', atob(result.compile_output));
        }
    }
}

// Example 4: Test runtime error
async function testRuntimeError() {
    console.log('=== Testing Runtime Error ===');
    
    const javaCode = `
public class Main {
    public static void main(String[] args) {
        int[] arr = new int[5];
        System.out.println(arr[10]); // Array index out of bounds
    }
}`;

    const token = await createSubmission(javaCode, 62);
    if (token) {
        const result = await getSubmissionWithWait(token, 5);
        console.log('Status:', result.status.description);
        if (result.stderr) {
            console.log('Error:', atob(result.stderr));
        }
    }
}

// Example 5: Batch submission test
async function testBatchSubmissions() {
    console.log('=== Testing Batch Submissions ===');
    
    const submissions = [
        {
            source_code: 'public class Main { public static void main(String[] args) { System.out.println("Test 1"); } }',
            language_id: 62,
            stdin: ''
        },
        {
            source_code: 'public class Main { public static void main(String[] args) { System.out.println("Test 2"); } }',
            language_id: 62,
            stdin: ''
        }
    ];

    const batchResult = await createBatchSubmissions(submissions);
    if (batchResult) {
        const tokens = batchResult.map(r => r.token);
        
        // Wait and get batch results
        setTimeout(async () => {
            const results = await getBatchResults(tokens);
            console.log('Batch Results:', results);
        }, 3000);
    }
}

// Common Language IDs for reference
const LANGUAGE_IDS = {
    BASH: 46,
    C: 50,
    CPP: 54,
    CSHARP: 51,
    JAVA: 62,
    JAVASCRIPT: 63,
    PYTHON: 71,
    RUBY: 72,
    GO: 60,
    RUST: 73,
    PHP: 68,
    SWIFT: 83,
    KOTLIN: 78,
    SCALA: 81
};

// Utility function to decode base64 output
function decodeOutput(base64String) {
    return base64String ? atob(base64String) : '';
}

async function diagnoseJudge0() {
    const baseUrl = 'http://localhost:2358';
    
    try {
        // Test system info
        const sysInfo = await fetch(`${baseUrl}/system_info`);
        console.log('System Info Status:', sysInfo.status);
        
        // Test languages
        const languages = await fetch(`${baseUrl}/languages`);
        console.log('Languages Status:', languages.status);
        
        // Test simple submission
        const submission = await fetch(`${baseUrl}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_code: btoa('printf("test");'),
                language_id: 50
            })
        });
        
        const success = await submission.json();
        console.log('Submission success:', success);
        console.log('Submission Status:', submission.status);
        if(submission.status === 201) {
            getSubmissionResult(success.token).then(result => {
                console.log('Submission Result:', result);
                if (result.stdout) {
                    console.log('Output:', decodeOutput(result.stdout));
                }
            })
        }
        if (!submission.ok) {
            const error = await submission.text();
            console.log('Submission Error:', error);
        }
        
    } catch (error) {
        console.error('Diagnostic Error:', error);
    }
}



// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createSubmission,
        getSubmissionResult,
        getSubmissionWithWait,
        createBatchSubmissions,
        getBatchResults,
        getLanguages,
        getSystemInfo,
        deleteSubmission,
        testJavaHelloWorld,
        testJavaWithInput,
        testCompilationError,
        testRuntimeError,
        testBatchSubmissions,
        LANGUAGE_IDS,
        decodeOutput
    };
}
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">New Test Page</h1>
      <p className="text-lg text-gray-700">This is a new test page.</p>

      <button
      onClick={() => testJavaHelloWorld()}
      className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Java test
      </button>

      <button
      onClick={() => diagnoseJudge0()}
      className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        test run diagnose
      </button>
    </div>
  );
}

export default Newtest;