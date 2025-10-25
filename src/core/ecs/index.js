const asFactory = (defaults) => {
  if (typeof defaults === "function") return defaults
  return () => ({ ...defaults })
}

export const defineComponent = (name, defaults = () => ({})) => {
  const factory = asFactory(defaults)
  const key = Symbol(name)

  return {
    key,
    name,
    create(initial = {}) {
      return {
        ...factory(),
        ...initial,
      }
    },
  }
}

export const createRegistry = () => {
  const entityComponents = new Map()
  const componentStores = new Map()
  let nextId = 1

  const ensureEntity = (entity) => {
    if (!entityComponents.has(entity)) {
      entityComponents.set(entity, new Set())
    }
  }

  const ensureStore = (component) => {
    const store = componentStores.get(component.key)
    if (store) return store
    const created = new Map()
    componentStores.set(component.key, created)
    return created
  }

  return {
    createEntity() {
      const id = nextId++
      entityComponents.set(id, new Set())
      return id
    },

    addComponent(entity, component, data = {}) {
      ensureEntity(entity)
      const store = ensureStore(component)
      const value = component.create(data)
      store.set(entity, value)
      entityComponents.get(entity).add(component.key)
      return value
    },

    removeComponent(entity, component) {
      const store = componentStores.get(component.key)
      if (!store) return
      store.delete(entity)
      const set = entityComponents.get(entity)
      if (set) set.delete(component.key)
    },

    getComponent(entity, component) {
      const store = componentStores.get(component.key)
      return store ? store.get(entity) : undefined
    },

    hasComponent(entity, component) {
      const set = entityComponents.get(entity)
      return set ? set.has(component.key) : false
    },

    query(...components) {
      const requiredKeys = components.map((component) => component.key)
      const results = []
      for (const [entity, componentSet] of entityComponents.entries()) {
        let matches = true
        for (const key of requiredKeys) {
          if (!componentSet.has(key)) {
            matches = false
            break
          }
        }
        if (matches) results.push(entity)
      }
      return results
    },
  }
}

export const createSystemRunner = (registry) => {
  const systems = []

  return {
    addSystem(system) {
      systems.push(system)
      return () => {
        const index = systems.indexOf(system)
        if (index >= 0) systems.splice(index, 1)
      }
    },

    run(delta, context = {}) {
      for (const system of systems) {
        const entities = registry.query(...system.components)
        if (entities.length === 0) continue

        for (const entity of entities) {
          const componentData = {}
          for (const component of system.components) {
            componentData[component.name] = registry.getComponent(entity, component)
          }

          system.update({
            entity,
            components: componentData,
            delta,
            registry,
            context,
          })
        }
      }
    },
  }
}
