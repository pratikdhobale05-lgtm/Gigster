const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

// Helper function for API requests using native fetch
async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...options.headers
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? (options.body instanceof FormData ? options.body : JSON.stringify(options.body)) : undefined
    });

    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    return { status: res.status, ok: res.ok, data };
}

async function runEndToEndTests() {
    console.log('🚀 Starting Gigster Marketplace End-to-End Test Suite...\n');
    let passed = 0;
    let failed = 0;

    const assert = (condition, testName, extraInfo = '') => {
        if (condition) {
            console.log(`  ✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${testName} ${extraInfo ? '(' + extraInfo + ')' : ''}`);
            failed++;
        }
    };

    try {
        const timestamp = Date.now();
        const clientEmail = `client_${timestamp}@example.com`;
        const freelancerEmail = `freelancer_${timestamp}@example.com`;
        const password = 'Password123!';

        // 1. Auth: Register Client & Freelancer
        console.log('1. Testing User Registration & Authentication');
        const regClient = await apiRequest('/auth/register', {
            method: 'POST',
            body: { name: 'Test Client', email: clientEmail, password, role: 'client' }
        });
        assert(regClient.status === 201 && regClient.data.token, 'Register Client User');
        const clientToken = regClient.data?.token;
        const clientId = regClient.data?.data?.user?._id;

        const regFreelancer = await apiRequest('/auth/register', {
            method: 'POST',
            body: { name: 'Test Freelancer', email: freelancerEmail, password, role: 'freelancer' }
        });
        assert(regFreelancer.status === 201 && regFreelancer.data.token, 'Register Freelancer User');
        const freelancerToken = regFreelancer.data?.token;
        const freelancerId = regFreelancer.data?.data?.user?._id;

        // 2. Client Posts a Project
        console.log('\n2. Testing Project Creation & Marketplace Feed');
        const postProject = await apiRequest('/projects', {
            method: 'POST',
            token: clientToken,
            body: {
                title: `Full-Stack E-Commerce Dashboard ${timestamp}`,
                description: 'Build a full stack React and Node dashboard with charts',
                category: 'Web Development',
                budget: 1500,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        });
        assert(postProject.status === 201 && postProject.data.data?.project?._id, 'Client creates project');
        const projectId = postProject.data?.data?.project?._id;

        // 3. Freelancer Browses Open Projects
        const openProjects = await apiRequest('/projects', { token: freelancerToken });
        assert(openProjects.status === 200 && openProjects.data.data?.projects?.some(p => p._id === projectId), 'Freelancer views open project feed');

        // 4. Freelancer Submits a Proposal
        console.log('\n3. Testing Bidding & Proposal Workflow');
        const submitProposal = await apiRequest('/proposals', {
            method: 'POST',
            token: freelancerToken,
            body: {
                project: projectId,
                price: 1400,
                coverLetter: 'I am a senior developer with extensive React experience. I can deliver this project quickly.'
            }
        });
        assert(submitProposal.status === 201 && submitProposal.data.data?._id, 'Freelancer submits proposal');
        const proposalId = submitProposal.data?.data?._id;

        // 5. Client Fetches Proposals & Accepts
        const getProposals = await apiRequest(`/proposals?project=${projectId}`, { token: clientToken });
        assert(getProposals.status === 200 && getProposals.data.data?.length > 0, 'Client views proposals');

        const acceptProposal = await apiRequest(`/proposals/${proposalId}/accept`, {
            method: 'PUT',
            token: clientToken
        });
        assert(acceptProposal.status === 200 && acceptProposal.data.data?.project?.status === 'in_progress', 'Client accepts proposal & hires freelancer');
        const milestoneId = acceptProposal.data?.data?.milestone?._id;

        // 6. Payment & Escrow Funding Flow
        console.log('\n4. Testing Payment Engine & Escrow Initialization');
        const createOrder = await apiRequest(`/escrow/milestones/${projectId}/create-order`, {
            method: 'POST',
            token: clientToken
        });
        assert(createOrder.status === 200 && createOrder.data.data?.orderId, 'Client creates Razorpay order');
        const orderId = createOrder.data?.data?.orderId;

        const verifyPayment = await apiRequest(`/escrow/milestones/${projectId}/verify-payment`, {
            method: 'POST',
            token: clientToken,
            body: {
                razorpay_order_id: orderId,
                razorpay_payment_id: 'pay_sim_test123',
                razorpay_signature: 'sim_signature_valid'
            }
        });
        assert(verifyPayment.status === 200 && verifyPayment.data.data?.milestone?.status === 'funded', 'Client verifies payment & funds milestone');

        // 7. Workspace Messaging & File Upload
        console.log('\n5. Testing Workspace Real-Time Chat & Attachments');
        const fileFormData = new FormData();
        fileFormData.append('file', new Blob(['Sample attachment contents for project review'], { type: 'text/plain' }), 'deliverable_spec.txt');

        const uploadFile = await apiRequest('/messages/upload', {
            method: 'POST',
            token: freelancerToken,
            body: fileFormData
        });
        assert(uploadFile.status === 200 && uploadFile.data.data?.fileUrl, 'Upload chat file attachment');

        const getChatHistory = await apiRequest(`/messages/project/${projectId}`, { token: clientToken });
        assert(getChatHistory.status === 200, 'Fetch project workspace chat history');

        // 8. Freelancer Submits Work
        console.log('\n6. Testing Submission & Approval Workflow');
        const submitWork = await apiRequest(`/escrow/milestones/${projectId}/submit`, {
            method: 'PATCH',
            token: freelancerToken
        });
        assert(submitWork.status === 200, 'Freelancer submits work for review');

        // RBAC Security Check: Freelancer CANNOT approve work
        const illegalApprove = await apiRequest(`/escrow/milestones/${projectId}/approve`, {
            method: 'PATCH',
            token: freelancerToken
        });
        assert(illegalApprove.status === 403, 'RBAC Enforced: Freelancer cannot approve work');

        // 9. Client Approves Work & Releases Escrow
        const approveWork = await apiRequest(`/escrow/milestones/${projectId}/approve`, {
            method: 'PATCH',
            token: clientToken
        });
        assert(approveWork.status === 200, 'Client approves work & releases escrow funds');

        // Verify Project Status is Completed
        const checkCompletedProject = await apiRequest(`/projects/${projectId}`, { token: clientToken });
        assert(checkCompletedProject.data.data?.status === 'completed', 'Project status marked completed');

        // 10. Rating & Review Submission & Score Aggregation
        console.log('\n7. Testing Reviews & Score Aggregation');
        const submitReview = await apiRequest('/reviews', {
            method: 'POST',
            token: clientToken,
            body: {
                projectId,
                rating: 5,
                comment: 'Outstanding work! Highly skilled and communicative.'
            }
        });
        assert(submitReview.status === 201, 'Client submits 5-star review');

        const getProfile = await apiRequest(`/users/${freelancerId}`, { token: clientToken });
        assert(getProfile.data.data?.user?.ratingsAverage === 5, 'Freelancer ratingsAverage aggregated to 5.0');

        // 11. Dispute Flow Testing
        console.log('\n8. Testing Dispute Edge-Case Workflow');
        // Create 2nd project for dispute test
        const proj2 = await apiRequest('/projects', {
            method: 'POST',
            token: clientToken,
            body: {
                title: `Dispute Test Project ${timestamp}`,
                description: 'Test dispute locking flow',
                category: 'Design',
                budget: 800,
                deadline: new Date().toISOString()
            }
        });
        const proj2Id = proj2.data?.data?.project?._id;

        const prop2 = await apiRequest('/proposals', {
            method: 'POST',
            token: freelancerToken,
            body: { project: proj2Id, price: 800, coverLetter: 'I will design your app.' }
        });

        await apiRequest(`/proposals/${prop2.data.data._id}/accept`, { method: 'PUT', token: clientToken });
        const order2 = await apiRequest(`/escrow/milestones/${proj2Id}/create-order`, { method: 'POST', token: clientToken });
        await apiRequest(`/escrow/milestones/${proj2Id}/verify-payment`, {
            method: 'POST',
            token: clientToken,
            body: {
                razorpay_order_id: order2.data.data.orderId,
                razorpay_payment_id: 'pay_sim_disp123',
                razorpay_signature: 'sim_signature_valid'
            }
        });

        const raiseDispute = await apiRequest(`/escrow/milestones/${proj2Id}/dispute`, {
            method: 'POST',
            token: freelancerToken
        });
        assert(raiseDispute.status === 200, 'Freelancer/Client raises dispute, locking funds');

        const checkDisputedProject = await apiRequest(`/projects/${proj2Id}`, { token: clientToken });
        assert(checkDisputedProject.data.data?.status === 'disputed', 'Project status marked disputed');

    } catch (err) {
        console.error('\n❌ Unexpected error running tests:', err);
        failed++;
    }

    console.log('\n════════════════════════════════════════════');
    console.log(`📊 TEST RESULTS: ${passed} Passed | ${failed} Failed`);
    console.log('════════════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
}

runEndToEndTests();
