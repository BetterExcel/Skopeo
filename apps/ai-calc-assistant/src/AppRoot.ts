import { h, defineComponent } from 'vue';
import Sidebar from './Sidebar.vue';

export default defineComponent<{ config: any }>({
  name: 'AppRoot',
  props: { config: { type: Object, required: false } },
  setup(props: { config?: any }) {
    return () => h(Sidebar, { config: props.config });
  },
});
