import { ref, type Ref } from "vue";

export default function useInput(
  defaultValue: string = ""
): [Ref<string>, (event: any) => void, (val: string) => void] {
  const value = ref<string>(defaultValue);

  function handleValueChange(event: any): void {
    value.value = event?.target?.value !== undefined ? event.target.value : event;
  }

  return [value, handleValueChange, (val: string) => { value.value = val; }];
}
