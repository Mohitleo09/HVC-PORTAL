// Test script to verify workflow creation and race condition handling
const testWorkflowCreation = async () => {
  console.log('🧪 Testing workflow creation...');
  
  const testData = {
    scheduleId: '507f1f77bcf86cd799439011', // Mock ObjectId
    doctorName: 'Dr. Test Doctor',
    departmentName: 'Test Department'
  };
  
  try {
    // Test 1: Create workflow
    console.log('\n📝 Test 1: Creating workflow...');
    const response1 = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result1 = await response1.json();
    console.log('✅ Response 1:', result1);
    
    // Test 2: Try to create duplicate (should return existing workflow)
    console.log('\n📝 Test 2: Creating duplicate workflow...');
    const response2 = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result2 = await response2.json();
    console.log('✅ Response 2:', result2);
    
    // Test 3: Verify both responses have same workflow ID
    if (result1.success && result2.success && result1.workflow._id === result2.workflow._id) {
      console.log('✅ Success: Both requests returned the same workflow ID');
      console.log('🆔 Workflow ID:', result1.workflow._id);
    } else {
      console.log('❌ Error: Workflow IDs do not match');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test if in browser environment
if (typeof window !== 'undefined') {
  // Add test button to page
  const testButton = document.createElement('button');
  testButton.textContent = '🧪 Test Workflow Creation';
  testButton.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
  testButton.onclick = testWorkflowCreation;
  document.body.appendChild(testButton);
  
  console.log('🧪 Workflow creation test script loaded. Click the test button to run tests.');
}

export { testWorkflowCreation };
