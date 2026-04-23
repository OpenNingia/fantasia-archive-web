// Shim: vue-class-component@8 renamed Component → Options.
// vue-property-decorator@9 expects Component as both default and named export.
import { Options, Vue, createDecorator, mixins, prop, setup } from "vue-class-component"

export default Options           // default import expected by vue-property-decorator
export { Options as Component, Options, Vue, createDecorator, mixins, prop, setup }
