import * as XLSX from "xlsx";

export const parseExcelDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value === "number") {
        const date = XLSX.SSF.parse_date_code(value);
        return date ? new Date(date.y, date.m - 1, date.d) : null;
    }

    if (typeof value === "string") {
        const parts = value.split("/");
        if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            if (day && month && year) return new Date(year, month - 1, day);
        }
    }

    return null;
};

export const handleFileUpload = ({
    event,
    kpiNamesActive,
    showToast,
    fileUploadRef,
    setRows,
}) => {
    const file = event.files?.[0];
    if (!file) return;
    const validExtensions = ["xls", "xlsx", "csv"];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
        showToast(
            "warn",
            "ประเภทไฟล์ไม่ถูกต้อง",
            "กรุณาอัปโหลดไฟล์ Excel (.xls, .xlsx, .csv) เท่านั้น"
        );
        fileUploadRef.current?.clear();
        return;
    }
    const reader = new FileReader();
    reader.onload = ({ target }) => {
        const workbook = XLSX.read(target.result, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData?.length || jsonData.length <= 1) {
            showToast(
                "warn",
                "ไม่พบข้อมูล",
                "ไฟล์ Excel ว่างหรือไม่มีข้อมูลให้นำเข้า"
            );
            fileUploadRef.current?.clear();
            return;
        }

        const importedRows = [];

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row.length) continue;

            // Skip truly empty rows
            const hasData = row.some(
                (cell) => cell != null && String(cell).trim() !== ""
            );
            if (!hasData) continue;

            // Excel structure: ลำดับ, ตัวชี้วัด, ตัวตั้ง, ตัวหาร, เดือน/ปี, ค่าตัวตั้ง, ค่าตัวหาร, ประเภท
            const [, kpiLabel, , , dateVal, a_value = "", b_value = "", type = ""] =
                row;

            // Try to match KPI label → ID
            const matchedKpi = kpiNamesActive.find(
                (k) => k.label.trim() === String(kpiLabel || "").trim()
            );

            const report_date = parseExcelDate(dateVal);

            importedRows.push({
                id: importedRows.length + 1,
                kpi_name: matchedKpi ? matchedKpi.value : null,
                a_name: matchedKpi?.a_name || "",
                b_name: matchedKpi?.b_name || "",
                report_date: report_date || null,
                a_value: a_value || "",
                b_value: b_value || "",
                type: type || "",
            });
        }

        if (!importedRows.length) {
            showToast(
                "warn",
                "ข้อมูลไม่ถูกต้อง",
                "ไม่พบข้อมูลที่มีรูปแบบถูกต้องให้นำเข้า"
            );
            fileUploadRef.current?.clear();
            return;
        }

        setRows((prev) => {
            const existing = prev.filter(
                (r) =>
                    r.kpi_name ||
                    r.a_name ||
                    r.b_name ||
                    r.a_value ||
                    r.b_value ||
                    r.type ||
                    r.report_date
            );

            const startId = existing.length + 1;
            const merged = [
                ...existing,
                ...importedRows.map((r, i) => ({ ...r, id: startId + i })),
            ];

            return merged;
        });

        showToast("success", "สำเร็จ", "นำเข้าข้อมูลเรียบร้อยแล้ว");
        fileUploadRef.current?.clear();
    };

    reader.readAsBinaryString(file);
};
