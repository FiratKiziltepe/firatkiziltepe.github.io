/**
 * Multi-Step Modal Logic
 * Handles step navigation for custom question type modal
 */

class MultiStepModal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.currentStep = 1;
        this.totalSteps = 2;

        this.init();
    }

    init() {
        // Get elements
        this.prevBtn = document.getElementById('prevStepBtn');
        this.nextBtn = document.getElementById('nextStepBtn');
        this.saveBtn = document.getElementById('saveCustomType');

        // Bind events
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevStep());
        }

        // Reset to step 1 when modal opens
        const modal = this.modal;
        if (modal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const isHidden = modal.classList.contains('hidden');
                        if (!isHidden && this.currentStep !== 1) {
                            // Modal opened, reset to step 1
                            this.goToStep(1);
                        }
                    }
                });
            });

            observer.observe(modal, { attributes: true });
        }
    }

    goToStep(step) {
        if (step < 1 || step > this.totalSteps) return;

        // Update current step
        this.currentStep = step;

        // Update form steps
        document.querySelectorAll('.form-step').forEach((formStep, index) => {
            if (index + 1 === step) {
                formStep.classList.add('active');
            } else {
                formStep.classList.remove('active');
            }
        });

        // Update step indicators
        document.querySelectorAll('.step').forEach((stepEl, index) => {
            const stepNum = index + 1;

            if (stepNum < step) {
                // Completed steps
                stepEl.classList.add('completed');
                stepEl.classList.remove('active');

                // Show checkmark
                const circle = stepEl.querySelector('.step-circle');
                if (circle) {
                    circle.innerHTML = '<i class="fas fa-check"></i>';
                }
            } else if (stepNum === step) {
                // Current step
                stepEl.classList.add('active');
                stepEl.classList.remove('completed');

                // Restore original icon
                const circle = stepEl.querySelector('.step-circle');
                if (circle) {
                    if (stepNum === 1) {
                        circle.innerHTML = '<i class="fas fa-info-circle"></i>';
                    } else if (stepNum === 2) {
                        circle.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                    }
                }
            } else {
                // Future steps
                stepEl.classList.remove('active', 'completed');

                // Restore original icon
                const circle = stepEl.querySelector('.step-circle');
                if (circle) {
                    if (stepNum === 1) {
                        circle.innerHTML = '<i class="fas fa-info-circle"></i>';
                    } else if (stepNum === 2) {
                        circle.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                    }
                }
            }
        });

        // Update buttons
        this.updateButtons();
    }

    updateButtons() {
        // Previous button
        if (this.currentStep === 1) {
            this.prevBtn.classList.add('hidden');
        } else {
            this.prevBtn.classList.remove('hidden');
        }

        // Next/Save buttons
        if (this.currentStep === this.totalSteps) {
            this.nextBtn.classList.add('hidden');
            this.saveBtn.classList.remove('hidden');
        } else {
            this.nextBtn.classList.remove('hidden');
            this.saveBtn.classList.add('hidden');
        }
    }

    nextStep() {
        // Validate current step
        if (!this.validateStep(this.currentStep)) {
            return;
        }

        this.goToStep(this.currentStep + 1);
    }

    prevStep() {
        this.goToStep(this.currentStep - 1);
    }

    validateStep(step) {
        if (step === 1) {
            // Validate basic info
            const nameTr = document.getElementById('customTypeName').value.trim();
            const nameEn = document.getElementById('customTypeNameEn').value.trim();

            if (!nameTr || !nameEn) {
                this.showError('Lütfen tüm zorunlu alanları doldurun');
                return false;
            }
        } else if (step === 2) {
            // Validate description & example
            const desc = document.getElementById('customTypeDesc').value.trim();
            const example = document.getElementById('customTypeExample').value.trim();

            if (!desc || !example) {
                this.showError('Lütfen açıklama ve örnek soru giriniz');
                return false;
            }
        }

        return true;
    }

    showError(message) {
        // Create or update error message
        let errorDiv = this.modal.querySelector('.step-error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'step-error bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2';

            const activeStep = this.modal.querySelector('.form-step.active');
            if (activeStep) {
                activeStep.insertBefore(errorDiv, activeStep.firstChild);
            }
        }

        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle text-red-600"></i>
            <span class="font-medium">${message}</span>
        `;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.remove();
            }
        }, 3000);
    }

    reset() {
        this.goToStep(1);

        // Clear form
        document.getElementById('customTypeName').value = '';
        document.getElementById('customTypeNameEn').value = '';
        document.getElementById('customTypeDesc').value = '';
        document.getElementById('customTypeExample').value = '';

        // Remove any error messages
        const errors = this.modal.querySelectorAll('.step-error');
        errors.forEach(err => err.remove());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.customTypeModalStepper = new MultiStepModal('customTypeModal');
});

// Export for use in other modules if needed
export default MultiStepModal;
