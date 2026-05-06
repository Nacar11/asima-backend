export function TransformMenu() {
  return function (target: any, key: string) {
    Reflect.defineMetadata('custom:transformMenu', true, target, key);
  };
}
