/** Typert remote: the settings page reaches these host methods over the host gateway. */

const codec = (name, parse) => ({ mode: 'strict', typeSymbol: `dsh-novel-memory#${name}`, create: () => ({ parse }) })
const jsonResult = codec('Value', value => value)

function method(name, wire) {
  return {
    id: `dsh-novel-memory#novelMemory/${name}`,
    service: 'novelMemory',
    namespace: 'novelMemory',
    method: name,
    invocation: { kind: 'direct' },
    result: jsonResult,
    parameters: wire ? [{ name: wire, wire, source: 'json', codec: codec('Payload', value => value) }] : [],
  }
}

export const REMOTE_DESCRIPTORS = Object.freeze([
  method('books'),
  method('book', 'request'),
  method('open', 'request'),
  method('save', 'request'),
  method('forget', 'request'),
])

export const REMOTE_MOUNT = Object.freeze({ package: 'dsh-novel-memory', descriptors: REMOTE_DESCRIPTORS })

/**
 * The gateway refuses a Remote call unless the receiving Service declares which
 * endpoint namespace it owns. Generated Services carry this field; ours is a
 * plain object, so it has to be attached by hand before `ctx.provide`.
 */
function bind(service) {
  Object.defineProperty(service, 'typertRemote', {
    value: Object.freeze({ service, serviceKey: 'novelMemory', namespace: 'novelMemory' }),
    enumerable: false,
    configurable: false,
    writable: false,
  })
  return service
}

export function mountRemote(ctx, store, createService) {
  ctx.inject(['typert'], root => {
    const service = bind(createService(store))
    root.provide('novelMemory', service)
    root.typert.register({
      package: 'dsh-novel-memory',
      face: 'host',
      schemas: [],
      model: { services: [], events: [], objects: [] },
      invocations: REMOTE_DESCRIPTORS,
    })
  })
}
