<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { csrfFetch } from '$lib/utils/csrf';

  let isScrolled = false;
  let isMobileMenuOpen = false;
  let isUserMenuOpen = false;

  onMount(() => {
    const handleScroll = () => {
      isScrolled = window.scrollY > 0;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
    { href: '/tv', label: 'TV Shows' },
    { href: '/watchlist', label: 'Watchlist', requiresAuth: true }
  ];

  async function handleLogout() {
    try {
      await csrfFetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
</script>

<nav
  class="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
  class:bg-gray-900={isScrolled}
  class:backdrop-blur={isScrolled}
>
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <span class="text-2xl font-bold text-primary-400">Streamium</span>
      </a>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center gap-6">
        {#each navItems as item}
          {#if !item.requiresAuth || $authStore.isAuthenticated}
            <a
              href={item.href}
              class="text-gray-300 hover:text-white transition-colors"
              class:text-primary-400={$page.url.pathname === item.href}
            >
              {item.label}
            </a>
          {/if}
        {/each}
      </div>

      <!-- Search and User Menu -->
      <div class="flex items-center gap-4">
        <a
          href="/search"
          class="p-2 text-gray-300 hover:text-white transition-colors"
          aria-label="Search"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </a>

        {#if $authStore.isAuthenticated}
          <!-- User Menu -->
          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-2 p-2 text-gray-300 hover:text-white transition-colors"
              on:click={() => isUserMenuOpen = !isUserMenuOpen}
              aria-label="User menu"
            >
              <span class="text-sm">{$authStore.user?.username}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {#if isUserMenuOpen}
              <div class="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl">
                {#if $authStore.user?.isAdmin}
                  <a
                    href="/admin/moderation"
                    class="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700"
                    on:click={() => isUserMenuOpen = false}
                  >
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Moderation</span>
                    </div>
                  </a>
                {/if}
                <button
                  type="button"
                  class="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700"
                  on:click={handleLogout}
                >
                  Logout
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <!-- Auth Links -->
          <div class="hidden md:flex items-center gap-4">
            <a
              href="/login"
              class="text-gray-300 hover:text-white transition-colors"
            >
              Login
            </a>
            <a
              href="/register"
              class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Register
            </a>
          </div>
        {/if}

        <!-- Mobile Menu Button -->
        <button
          type="button"
          class="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          on:click={() => isMobileMenuOpen = !isMobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if isMobileMenuOpen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            {/if}
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    {#if isMobileMenuOpen}
      <div class="md:hidden py-4 space-y-2">
        {#each navItems as item}
          {#if !item.requiresAuth || $authStore.isAuthenticated}
            <a
              href={item.href}
              class="block px-4 py-2 text-gray-300 hover:text-white transition-colors"
              class:text-primary-400={$page.url.pathname === item.href}
              on:click={() => isMobileMenuOpen = false}
            >
              {item.label}
            </a>
          {/if}
        {/each}

        {#if $authStore.isAuthenticated && $authStore.user?.isAdmin}
          <a
            href="/admin/moderation"
            class="block px-4 py-2 text-gray-300 hover:text-white transition-colors"
            on:click={() => isMobileMenuOpen = false}
          >
            Moderation
          </a>
        {/if}

        {#if !$authStore.isAuthenticated}
          <div class="pt-4 border-t border-gray-700">
            <a
              href="/login"
              class="block px-4 py-2 text-gray-300 hover:text-white transition-colors"
              on:click={() => isMobileMenuOpen = false}
            >
              Login
            </a>
            <a
              href="/register"
              class="block px-4 py-2 text-gray-300 hover:text-white transition-colors"
              on:click={() => isMobileMenuOpen = false}
            >
              Register
            </a>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</nav>

<!-- Spacer to prevent content from being hidden under fixed navbar -->
<div class="h-16"></div>
