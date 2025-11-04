/**
 * Modal System Demo
 * 
 * This file demonstrates how to use the modal system.
 * You can test these by opening the browser console and calling:
 * 
 * import('./js/modules/modal-demo.js').then(m => m.runDemo())
 */

import modalManager from './ModalManager.js';
import ModalTemplates from './ModalTemplates.js';

export function runDemo() {
  console.log('🎬 Modal System Demo');
  console.log('Available demos:');
  console.log('1. demoFeatures() - Show features modal');
  console.log('2. demoHowItWorks() - Show how it works modal');
  console.log('3. demoSettings() - Show settings modal');
  console.log('4. demoNetworkStatus() - Show network status modal');
  console.log('5. demoError() - Show error modal');
  console.log('6. demoSuccess() - Show success modal');
  console.log('7. demoLoading() - Show loading modal');
  console.log('8. demoConfirm() - Show confirmation dialog');
  console.log('9. demoAlert() - Show alert dialog');
  console.log('10. demoCustom() - Show custom modal');
  
  return {
    demoFeatures,
    demoHowItWorks,
    demoSettings,
    demoNetworkStatus,
    demoError,
    demoSuccess,
    demoLoading,
    demoConfirm,
    demoAlert,
    demoCustom
  };
}

export function demoFeatures() {
  const config = ModalTemplates.features();
  modalManager.open('info-modal', config);
  console.log('✅ Features modal opened');
}

export function demoHowItWorks() {
  const config = ModalTemplates.howItWorks();
  modalManager.open('info-modal', config);
  console.log('✅ How It Works modal opened');
}

export function demoSettings() {
  const config = ModalTemplates.settings();
  modalManager.open('info-modal', config);
  console.log('✅ Settings modal opened');
}

export function demoNetworkStatus() {
  const config = ModalTemplates.networkStatus({
    localIp: '192.168.1.100',
    publicIp: '203.0.113.1',
    connectionType: 'WiFi',
    downloadSpeed: '50.5',
    uploadSpeed: '10.2',
    ping: '25',
    status: 'good'
  });
  modalManager.open('status-modal', config);
  console.log('✅ Network Status modal opened');
}

export function demoError() {
  const config = ModalTemplates.error({
    title: 'Connection Failed',
    message: 'Unable to connect to the server. Please check your internet connection.',
    details: 'Error: ECONNREFUSED at 192.168.1.1:5000',
    actions: [
      {
        text: 'Try Again',
        class: 'btn-primary',
        onClick: () => {
          console.log('User clicked Try Again');
          modalManager.close('error-modal');
        }
      },
      {
        text: 'Cancel',
        class: 'btn-secondary',
        onClick: () => {
          console.log('User clicked Cancel');
          modalManager.close('error-modal');
        }
      }
    ]
  });
  modalManager.open('error-modal', config);
  console.log('✅ Error modal opened');
}

export function demoSuccess() {
  const config = ModalTemplates.success({
    title: 'Room Created!',
    message: 'Your room has been created successfully. Share the code with your friends!'
  });
  modalManager.open('info-modal', config);
  console.log('✅ Success modal opened');
  
  // Auto-close after 3 seconds
  setTimeout(() => {
    modalManager.close('info-modal');
    console.log('✅ Success modal auto-closed');
  }, 3000);
}

export function demoLoading() {
  const config = ModalTemplates.loading('Creating room...');
  modalManager.open('status-modal', config);
  console.log('✅ Loading modal opened');
  
  // Simulate async operation
  setTimeout(() => {
    modalManager.close('status-modal');
    console.log('✅ Loading modal closed');
    demoSuccess();
  }, 2000);
}

export async function demoConfirm() {
  console.log('⏳ Showing confirmation dialog...');
  const confirmed = await modalManager.confirm({
    title: 'Leave Room?',
    message: 'Are you sure you want to leave the room? You will need the room code to rejoin.',
    confirmText: 'Leave',
    cancelText: 'Stay'
  });
  
  if (confirmed) {
    console.log('✅ User confirmed');
  } else {
    console.log('❌ User cancelled');
  }
  
  return confirmed;
}

export function demoAlert() {
  modalManager.alert({
    title: 'Welcome!',
    message: 'Thanks for using SyncStream Pro. Enjoy watching together!',
    type: 'success',
    buttonText: 'Got it'
  });
  console.log('✅ Alert dialog opened');
}

export function demoCustom() {
  const modalId = modalManager.createModal({
    type: 'info',
    title: 'Custom Modal',
    icon: '🎉',
    size: 'md',
    content: `
      <div class="modal-section">
        <h3 class="modal-section-title">
          <span>🚀</span>
          This is a custom modal
        </h3>
        <p class="modal-section-description">
          You can create modals dynamically with custom content, buttons, and actions.
        </p>
        
        <div class="modal-glass-card" style="margin-top: var(--space-lg);">
          <p style="color: var(--text-secondary); margin: 0;">
            This modal was created using <code>modalManager.createModal()</code>
          </p>
        </div>
      </div>
    `,
    buttons: [
      {
        text: 'Cancel',
        class: 'btn-secondary',
        onClick: (modal) => {
          console.log('User clicked Cancel');
          modalManager.close(modal.id);
        }
      },
      {
        text: 'Awesome!',
        class: 'btn-primary',
        onClick: (modal) => {
          console.log('User clicked Awesome!');
          modalManager.close(modal.id);
        }
      }
    ]
  });
  console.log('✅ Custom modal opened with ID:', modalId);
}

// Auto-run demo menu when imported
console.log('📦 Modal Demo loaded. Run runDemo() to see available demos.');
