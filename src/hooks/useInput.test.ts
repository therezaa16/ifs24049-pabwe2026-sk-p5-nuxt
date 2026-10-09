import { describe, it, expect } from "vitest";
import useInput from "./useInput";

describe("useInput", () => {
  it("should initialize with default value and change value on change handler", () => {
    const [value, handleValueChange, setValue] = useInput("initial");

    expect(value.value).toBe("initial");

    handleValueChange({ target: { value: "updated" } });
    expect(value.value).toBe("updated");

    setValue("direct");
    expect(value.value).toBe("direct");
  });

  it("should initialize with empty string when no default given", () => {
    const [value] = useInput();
    expect(value.value).toBe("");
  });

  it("should accept direct value without target property", () => {
    const [value, handleValueChange] = useInput();
    handleValueChange("direct value");
    expect(value.value).toBe("direct value");
  });
});
