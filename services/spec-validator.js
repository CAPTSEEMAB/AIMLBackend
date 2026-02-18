class SpecValidator {
  static ALLOWED_COMPONENTS = new Set([
    'Stack',
    'Card',
    'Alert',
    'Button',
    'Text',
    'Input',
    'Label',
    'Separator',
    'RechartBar',
    'RechartLine',
    'RechartPie',
    'RechartScatter',
    'RechartArea',
    'DataTable',
    'Badge',
    'Tabs',
    'Dialog',
    'Drawer',
    'Popover',
    'Tooltip',
  ]);

  static validate(spec) {
    const errors = [];

    if (!spec) {
      return { valid: false, errors: ['Spec is null or undefined'] };
    }

    if (typeof spec !== 'object') {
      return { valid: false, errors: ['Spec must be an object'] };
    }

    errors.push(...this.validateStructure(spec));
    errors.push(...this.validateElements(spec));
    errors.push(...this.validateState(spec));

    return {
      valid: errors.length === 0,
      errors: errors,
      spec: errors.length === 0 ? spec : null,
    };
  }

  static validateStructure(spec) {
    const errors = [];

    if (!spec.root) {
      errors.push('Spec must have a "root" property pointing to entry element');
    }

    if (!spec.elements || typeof spec.elements !== 'object') {
      errors.push('Spec must have an "elements" object');
    }

    if (spec.root && spec.elements && !spec.elements[spec.root]) {
      errors.push(`Root element "${spec.root}" not found in elements`);
    }

    return errors;
  }

  static validateElements(spec) {
    const errors = [];

    if (!spec.elements) return errors;

    Object.entries(spec.elements).forEach(([elemId, element]) => {
      if (!element || typeof element !== 'object') {
        errors.push(`Element "${elemId}" must be an object`);
        return;
      }

      if (!element.type) {
        errors.push(`Element "${elemId}" must have a "type" property`);
        return;
      }

      if (!this.ALLOWED_COMPONENTS.has(element.type)) {
        errors.push(
          `Element "${elemId}" has unknown component type "${element.type}". Allowed: ${Array.from(this.ALLOWED_COMPONENTS).join(', ')}`
        );
      }

      if (element.children) {
        if (!Array.isArray(element.children)) {
          errors.push(
            `Element "${elemId}" children must be an array`
          );
        } else {
          element.children.forEach((childId) => {
            if (!spec.elements[childId]) {
              errors.push(
                `Element "${elemId}" references child "${childId}" which doesn't exist`
              );
            }
          });
        }
      }
    });

    return errors;
  }

  static validateState(spec) {
    const errors = [];

    if (!spec.state || typeof spec.state !== 'object') {
      return errors;
    }

    if (!Array.isArray(spec.state) && spec.state !== null) {
      Object.entries(spec.state).forEach(([key, value]) => {
        if (value === undefined) {
          errors.push(`State property "${key}" is undefined`);
        }
      });
    }

    return errors;
  }

  static validatePropBindings(spec) {
    const errors = [];

    if (!spec.elements) return errors;

    const stateKeys = spec.state ? Object.keys(spec.state) : [];

    Object.entries(spec.elements).forEach(([elemId, element]) => {
      if (element.props && typeof element.props === 'object') {
        Object.entries(element.props).forEach(([propKey, propValue]) => {
          if (propValue && typeof propValue === 'object' && propValue.$state) {
            const statePath = propValue.$state;
            const rootKey = statePath.split('/')[1];

            if (rootKey && !stateKeys.includes(rootKey)) {
              errors.push(
                `Element "${elemId}" prop "${propKey}" references state path "${statePath}" but state key "${rootKey}" doesn't exist`
              );
            }
          }
        });
      }
    });

    return errors;
  }

  static sanitize(spec) {
    if (!spec || typeof spec !== 'object') return null;

    return {
      root: spec.root || null,
      elements: spec.elements || {},
      state: spec.state || {},
    };
  }

  static report(validation) {
    if (validation.valid) {
      return {
        status: 'valid',
        message: 'Spec passed all validations',
        errorCount: 0,
      };
    }

    return {
      status: 'invalid',
      message: `Spec failed validation with ${validation.errors.length} error(s)`,
      errorCount: validation.errors.length,
      errors: validation.errors,
    };
  }
}

module.exports = SpecValidator;
