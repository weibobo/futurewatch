<script setup lang="ts">
import { 
  Edit, 
  Trash2, 
  Settings, 
  Plus,
  RefreshCw
} from 'lucide-vue-next';

interface Props {
  type: 'edit' | 'delete' | 'settings' | 'add' | 'refresh';
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 16
});
</script>

<template>
  <component 
    :is="{
      edit: Edit,
      delete: Trash2,
      settings: Settings,
      add: Plus,
      refresh: RefreshCw
    }[type]" 
    :size="size"
    class="inline-block"
  />
</template>