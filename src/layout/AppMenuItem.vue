<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from '@/layout/composables/layout';

const props = defineProps<{
  item: MenuItem,
  index: number,
  root: boolean,
  parentItemKey: string | null
}>();

const route = useRoute();

const { layoutState, setActiveMenuItem, onMenuToggle } = useLayout();

interface MenuItem {
  disabled?: boolean;
  label?: string;
  to?: string;
  url?: string;
  command?: (arg0: { originalEvent: Event, item: MenuItem }) => void;
  items?: MenuItem[];
  icon?: string;
  class?: string | string[] | Record<string, boolean>;
  target?: string;
  visible?: boolean;
  [key: string]: unknown;
}

const isActiveMenu = ref(false);
const itemKey = ref<string | null>(null);

onBeforeMount(() => {
  itemKey.value = props.parentItemKey ? `${props.parentItemKey}-${props.index}` : String(props.index);

  const activeItem = layoutState.activeMenuItem;

  isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(`${itemKey.value}-`) : false;
});

watch(
  () => layoutState.activeMenuItem,
  (newVal) => {
    isActiveMenu.value = !!(newVal === itemKey.value || (newVal && newVal.startsWith(`${itemKey.value}-`)));
  }
);

function itemClick(
  event: Event,
  item: MenuItem
) {
  if (item.disabled) {
    event.preventDefault();
    return;
  }

  if ((item.to || item.url) && (layoutState.staticMenuMobileActive || layoutState.overlayMenuActive)) {
    onMenuToggle();
  }

  if (item.command) {
    item.command({ originalEvent: event, item });
  }

  const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey.value) : itemKey.value;

  if (foundItemKey) {
    setActiveMenuItem(foundItemKey);
  }
}

function checkActiveRoute(item: { to?: string }) {
  return !!item.to && route.path === item.to;
}
</script>

<template>
  <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
    <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">
      {{ item.label }}
    </div>
    <a
      v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" :class="item.class"
      :target="item.target"
      tabindex="0" @click="itemClick($event, item)"
    >
      <i :class="item.icon" class="layout-menuitem-icon" />
      <span class="layout-menuitem-text">{{ item.label }}</span>
      <i v-if="item.items" class="pi pi-fw pi-angle-down layout-submenu-toggler" />
    </a>
    <router-link
      v-if="item.to && !item.items && item.visible !== false" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0"
      :to="item.to"
      @click="itemClick($event, item)"
    >
      <i :class="item.icon" class="layout-menuitem-icon" />
      <span class="layout-menuitem-text">{{ item.label }}</span>
      <i v-if="item.items" class="pi pi-fw pi-angle-down layout-submenu-toggler" />
    </router-link>
    <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
      <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
        <app-menu-item
          v-for="(child, i) in item.items" :key="child.label ?? i" :index="i"
          :item="child"
          :parent-item-key="itemKey" :root="false"
        />
      </ul>
    </Transition>
  </li>
</template>

<style lang="scss" scoped></style>
