// Allow importing the bundled TensorFlow Lite model as a static asset module id.
declare module '*.tflite' {
  const moduleId: number;
  export default moduleId;
}
