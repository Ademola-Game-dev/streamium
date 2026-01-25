<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { csrfFetch } from '$lib/utils/csrf';

  let newPassword = '';
  let confirmPassword = '';
  let error = '';
  let success = '';
  let loading = false;

  $: token = $page.params.token;

  function validatePassword(password: string): string | null {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = '';
    success = '';

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      error = passwordError;
      loading = false;
      return;
    }

    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      loading = false;
      return;
    }

    try {
      const response = await csrfFetch('/api/auth/reset-password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many attempts. Please try again later.');
        }
        throw new Error(data.error || 'Failed to reset password');
      }

      success = data.message;
      setTimeout(() => {
        goto('/login');
      }, 2000);
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred';
      if (error.includes('Invalid or expired')) {
        setTimeout(() => {
          goto('/reset-password');
        }, 2000);
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-[calc(100vh-4rem)] bg-gray-900 flex items-center justify-center px-4">
  <div class="max-w-md w-full">
    <div class="bg-gray-800 rounded-lg shadow-xl p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-center text-white">
          Set New Password
        </h1>
        <p class="mt-2 text-center text-gray-400">
          Please choose a strong password that includes uppercase and lowercase letters, numbers, and is at least 8 characters long.
        </p>
      </div>

      <form class="space-y-6" on:submit={handleSubmit}>
        {#if error}
          <div class="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            {error}
          </div>
        {/if}

        {#if success}
          <div class="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg">
            {success}
          </div>
        {/if}

        <div class="space-y-4">
          <div class="space-y-2">
            <label for="new-password" class="block text-sm font-medium text-gray-300">
              New Password
            </label>
            <input
              id="new-password"
              name="new-password"
              type="password"
              bind:value={newPassword}
              required
              minlength="8"
              class="appearance-none block w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Enter your new password"
            />
          </div>

          <div class="space-y-2">
            <label for="confirm-password" class="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              bind:value={confirmPassword}
              required
              minlength="8"
              class="appearance-none block w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Confirm your new password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Resetting password...</span>
          {:else}
            Reset Password
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>
