
        // Storage Configuration

        // To be stored on local storage
        const STORAGE_KEYS = {
            JOBS: 'jobs',
            USERS: 'users',
            APPLICATIONS: 'applications',
            CURRENT_USER: 'currentUser'
        };

        // Initialize default data
        function initializeStorage() {
            if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
                localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([]));
            }
            if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
                // Predetermined admin account to approve postings
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([{
                    id: 'admin1',
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin'
                }]));
            }
            if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
                localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
            }
        }
        localStorage.clear();
        // Utility Functions

        // Function to display a toast notification
        function showToast(message, isError = false) {
            // Get the toast element by its ID
            const toast = document.getElementById('toast');
            
            //set toast type text to toast msg
            toast.textContent = message;
            
            // Apply appropriate class type to toast
            toast.className = `toast ${isError ? 'error' : ''}`;
            toast.style.display = 'block';
            
            // Automatically hide the toast after 3 seconds
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }

        //helper getter and setter functions for local storage
        function getData(key) {
            return JSON.parse(localStorage.getItem(key)) || [];
        }
        function saveData(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        }

        // Modal Management
        function closeAllModals() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }

        // Assigns a close button to all modals
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.onclick = () => closeBtn.closest('.modal').style.display = 'none';
        });

        // Allows user to close modal by clicking outside of it
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };

        // Authentication
        document.getElementById('loginLink').onclick = () => {
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            if (currentUser) {
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                updateUIForUser(null);
                showToast('Logged out successfully');
                return;
            }
            document.getElementById('loginModal').style.display = 'block';
        };

        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const username = formData.get('username');
            const password = formData.get('password');

            const users = getData(STORAGE_KEYS.USERS);
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
                closeAllModals();
                e.target.reset();
                updateUIForUser(user);
                showToast('Logged in successfully');
                renderJobs();
            } else {
                showToast('Invalid credentials', true);
            }
        };

        // Registration
        document.getElementById('registerLink').onclick = () => {
            document.getElementById('registerModal').style.display = 'block';
        };

        document.getElementById('roleSelect').onchange = (e) => {
            const studentFields = document.getElementById('studentFields');
            const employerFields = document.getElementById('employerFields');

            studentFields.style.display = e.target.value === 'student' ? 'block' : 'none';
            employerFields.style.display = e.target.value === 'employer' ? 'block' : 'none';
        };

        document.getElementById('registerForm').onsubmit = (e) => {
            e.preventDefault();
            const role = document.getElementById('roleSelect').value;
            if (!role) {
                showToast('Please select a role', true);
                return;
            }

            const formData = new FormData(e.target);
            const userData = {
                id: Date.now().toString(),
                username: formData.get('username'),
                password: formData.get('password'),
                email: formData.get('email'),
                role: role
            };

            if (role === 'student') {
                userData.fullName = formData.get('fullName');
                userData.gradeLevel = formData.get('gradeLevel');
            } else {
                userData.companyName = formData.get('companyName');
                userData.website = formData.get('website');
            }

            const users = getData(STORAGE_KEYS.USERS);
            if (users.some(user => user.username === userData.username)) {
                showToast('Username already exists', true);
                return;
            }

            users.push(userData);
            saveData(STORAGE_KEYS.USERS, users);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));

            closeAllModals();
            e.target.reset();
            document.getElementById('roleSelect').value = '';
            document.getElementById('studentFields').style.display = 'none';
            document.getElementById('employerFields').style.display = 'none';
            updateUIForUser(userData);
            showToast('Registration successful!');
        };

        // Job Management
        document.getElementById('createJobBtn').onclick = () => {
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            if (!currentUser || currentUser.role !== 'employer') {
                showToast('Please login as an employer to post jobs', true);
                return;
            }
            document.getElementById('postJobModal').style.display = 'block';
        };

        document.getElementById('postJobForm').onsubmit = (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            const formData = new FormData(e.target);

            const jobData = {
                id: Date.now().toString(),
                employerId: currentUser.id,
                company: currentUser.companyName,
                title: formData.get('title'),
                jobType: formData.get('jobType'),
                department: formData.get('department'),
                location: formData.get('location'),
                salaryRange: {
                    min: formData.get('salaryMin'),
                    max: formData.get('salaryMax')
                },
                description: formData.get('description'),
                requirements: formData.get('requirements'),
                benefits: formData.get('benefits'),
                deadline: formData.get('deadline'),
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const jobs = getData(STORAGE_KEYS.JOBS);
            jobs.push(jobData);
            saveData(STORAGE_KEYS.JOBS, jobs);

            closeAllModals();
            e.target.reset();
            showToast('Job posted successfully! Waiting for admin approval');
            renderJobs();
            updateStats();
        };

        // Admin Functionality
        document.getElementById('adminLink').onclick = () => {
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            if (!currentUser || currentUser.role !== 'admin') {
                showToast('Admin access only', true);
                return;
            }

            renderPendingJobs();
            document.getElementById('adminModal').style.display = 'block';
        };

        function renderPendingJobs() {
            const pendingJobs = getData(STORAGE_KEYS.JOBS).filter(job => job.status === 'pending');
            const container = document.getElementById('pendingJobs');

            container.innerHTML = pendingJobs.length === 0 ? '<p>No pending jobs</p>' :
                pendingJobs.map(job => ` 
                    <div class="job-card">
                        <h3>${job.title}</h3>
                        <p><strong>Company:</strong> ${job.company}</p>
                        <p>${job.description}</p>
                        <div class="job-meta">${new Date(job.createdAt).toLocaleDateString()}</div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button onclick="approveJob('${job.id}')" class="btn">Approve</button>
                            <button onclick="rejectJob('${job.id}')"
                                class="btn" style="background: #f44336;">Reject</button>
                        </div>
                    </div>
                `).join('');
        }

        // Job Actions
        window.approveJob = (jobId) => {
            const jobs = getData(STORAGE_KEYS.JOBS);
            const jobIndex = jobs.findIndex(job => job.id === jobId);
            if (jobIndex !== -1) {
                jobs[jobIndex].status = 'approved';
                saveData(STORAGE_KEYS.JOBS, jobs);
                renderPendingJobs();
                renderJobs();
                updateStats();
                showToast('Job approved');
            }
        };

        window.rejectJob = (jobId) => {
            const jobs = getData(STORAGE_KEYS.JOBS);
            const jobIndex = jobs.findIndex(job => job.id === jobId);
            if (jobIndex !== -1) {
                jobs[jobIndex].status = 'rejected';
                saveData(STORAGE_KEYS.JOBS, jobs);
                renderPendingJobs();
                renderJobs();
                updateStats();
                showToast('Job rejected');
            }
        };

        // Job Search and Display
        document.getElementById('searchInput').oninput = (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const jobs = getData(STORAGE_KEYS.JOBS)
                .filter(job => job.status === 'approved')
                .filter(job =>
                    job.title.toLowerCase().includes(searchTerm) ||
                    job.company.toLowerCase().includes(searchTerm) ||
                    job.description.toLowerCase().includes(searchTerm)
                );

            renderJobs(jobs);
        };

        function renderJobs(jobsToDisplay) {
            const jobs = jobsToDisplay || getData(STORAGE_KEYS.JOBS).filter(job => job.status === 'approved');
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            const container = document.getElementById('jobListings');

            container.innerHTML = jobs.length === 0 ? '<p>No jobs found</p>' :
                jobs.map(job => `
                    <div class="job-card">
                        <h3 class="job-title">${job.title}</h3>
                        <div class="job-meta">
                            <span>${job.company}</span>
                            <span>${new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>${job.description}</p>
                        <div class="job-requirements">
                            <h4>Requirements:</h4>
                            <p>${job.requirements}</p>
                        </div>
                        ${currentUser && currentUser.role === 'student' ?
                        `<button onclick="showApplyForm('${job.id}')" class="btn">Apply Now</button>` : ''}
                        ${currentUser && currentUser.role === 'employer' && job.employerId === currentUser.id ?
                        `<button onclick="showApplications('${job.id}')" class="btn">View Applications (${getApplicationCount(job.id)})</button>` : ''}
                    </div>
                `).join('');
        }

        // Application System
        window.showApplyForm = (jobId) => {
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            if (!currentUser || currentUser.role !== 'student') {
                showToast('Please login as a student to apply', true);
                return;
            }

            const applyModal = document.getElementById('applyModal');
            applyModal.dataset.jobId = jobId;
            applyModal.style.display = 'block';
        };

        document.getElementById('applyForm').onsubmit = (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            const jobId = e.target.closest('.modal').dataset.jobId;
            const formData = new FormData(e.target);

            const applicationData = {
                id: Date.now().toString(),
                jobId: jobId,
                userId: currentUser.id,
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                gradeLevel: formData.get('gradeLevel'),
                gpa: formData.get('gpa'),
                coursework: formData.get('coursework'),
                experience: formData.get('experience'),
                skills: formData.get('skills'),
                coverLetter: formData.get('coverLetter'),
                references: formData.get('references'),
                status: 'PENDING',
                submittedAt: new Date().toISOString()
            };

            const applications = getData(STORAGE_KEYS.APPLICATIONS);
            applications.push(applicationData);
            saveData(STORAGE_KEYS.APPLICATIONS, applications);

            closeAllModals();
            e.target.reset();
            showToast('Application submitted successfully');
            updateStats();
        };

        // Application Management
        function getApplicationCount(jobId) {
            return getData(STORAGE_KEYS.APPLICATIONS)
                .filter(app => app.jobId === jobId).length;
        }

        window.showApplications = (jobId) => {
            const applications = getData(STORAGE_KEYS.APPLICATIONS)
                .filter(app => app.jobId === jobId);
            const container = document.getElementById('applicationsContainer');
            const modal = document.getElementById('manageApplicationsModal');

            container.innerHTML = applications.length === 0 ?
                '<p>No applications yet</p>' :
                applications.map(app => `
                    <div class="application-card">
                        <span class="status ${app.status.toLowerCase()}">${app.status}</span>
                        <h3>${app.fullName}</h3>
                        <div>
                            <strong>Email:</strong> ${app.email}<br>
                            <strong>Phone:</strong> ${app.phone}<br>
                            <strong>Grade Level:</strong> ${app.gradeLevel}<br>
                            ${app.gpa ? `<strong>GPA:</strong> ${app.gpa}<br>` : ''}
                        </div>
                        
                        <div style="margin: 1rem 0">
                            <strong>Cover Letter:</strong>
                            <p>${app.coverLetter}</p>
                        </div>
                        
                        ${app.experience ? `
                            <div style="margin: 1rem 0">
                                <strong>Experience:</strong>
                                <p>${app.experience}</p>
                            </div>
                        ` : ''}
                        
                        ${app.coursework ? `
                            <div style="margin: 1rem 0">
                                <strong>Relevant Coursework:</strong>
                                <p>${app.coursework}</p>
                            </div>
                        ` : ''}
                        
                        ${app.skills ? `
                            <div style="margin: 1rem 0">
                                <strong>Skills:</strong>
                                <p>${app.skills}</p>
                            </div>
                        ` : ''}

                        ${app.references ? `
                            <div style="margin: 1rem 0">
                                <strong>References:</strong>
                                <p>${app.references}</p>
                            </div>
                        ` : ''}

                        <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                            Submitted: ${new Date(app.submittedAt).toLocaleString()}
                        </div>

                        ${app.status === 'PENDING' ? `
                            <div class="application-actions">
                                <button onclick="handleApplication('${app.id}', 'APPROVED')" 
                                    class="btn approve">Approve</button>
                                <button onclick="handleApplication('${app.id}', 'REJECTED')" 
                                    class="btn reject">Reject</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');

            modal.style.display = 'block';
        };

        window.handleApplication = (applicationId, status) => {
            const applications = getData(STORAGE_KEYS.APPLICATIONS);
            const index = applications.findIndex(app => app.id === applicationId);

            if (index !== -1) {
                applications[index].status = status;
                applications[index].updatedAt = new Date().toISOString();

                saveData(STORAGE_KEYS.APPLICATIONS, applications);
                showApplications(applications[index].jobId);
                showToast(`Application ${status.toLowerCase()}`);
            }
        };

        // Stats Management
        function updateStats() {
            const jobs = getData(STORAGE_KEYS.JOBS);
            const applications = getData(STORAGE_KEYS.APPLICATIONS);

            document.getElementById('activeJobsCount').textContent =
                jobs.filter(job => job.status === 'approved').length;

            document.getElementById('companiesCount').textContent =
                [...new Set(jobs.filter(job => job.status === 'approved')
                    .map(job => job.company))].length;

            document.getElementById('applicationsCount').textContent = applications.length;
        }

        // UI State Management
        function updateUIForUser(user) {
            const adminLink = document.getElementById('adminLink');
            const createJobBtn = document.getElementById('createJobBtn');
            const loginLink = document.getElementById('loginLink');
            const registerLink = document.getElementById('registerLink');

            if (user) {
                loginLink.textContent = 'Logout';
                registerLink.style.display = 'none';
                adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
                createJobBtn.style.display = user.role === 'employer' ? 'block' : 'none';
            } else {
                loginLink.textContent = 'Login';
                registerLink.style.display = 'block';
                adminLink.style.display = 'none';
                createJobBtn.style.display = 'none';
            }
        }

        // Initialize Application
        function initializeApp() {
            initializeStorage();
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
            updateUIForUser(currentUser);
            renderJobs();
            updateStats();
        }

        // Start the application
        document.addEventListener('DOMContentLoaded', initializeApp);
    