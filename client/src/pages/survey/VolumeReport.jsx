import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { getSurvey } from '../../services/surveyServices';
import { handleFormError } from '../../utils/handleFormError';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { MdArrowBackIosNew } from 'react-icons/md';
import BasicButtons from '../../components/BasicButton';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const initialDetails = {
  initialEntry: '',
  secondaryEntry: '',
};

const VolumeReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const reportDetails = useRef(initialDetails);

  const { state } = useLocation();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState([]);

  const fetchSurvey = async () => {
    try {
      if (!global) {
        dispatch(startLoading());
      }

      const { data } = await getSurvey(id);

      if (data.success) {
        setSurvey(data.survey || []);
      } else {
        throw Error('Failed to fetch survey');
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const shortType = (type) => {
    if (!type) return type;
    return type.replace(/^Proposed\s+/i, 'Prop. ');
  };

  const tableData = useMemo(() => {
    let initialEntry = null;
    let secondaryEntry = null;

    if (state && state?.selectedPurposeIds?.length) {
      initialEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[0])
      );
      secondaryEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[1])
      );
    } else {
      initialEntry = survey?.purposes?.find((p) => p.type === 'Initial Level');
      secondaryEntry = survey?.purposes?.find(
        (p) => p.type === 'Proposed Level'
      );
    }

    if (!survey || !initialEntry || !secondaryEntry) return [];

    reportDetails.current = {
      initialEntry: shortType(initialEntry.type),
      secondaryEntry: shortType(secondaryEntry.type),
    };

    const initialRows = initialEntry?.rows ?? [];
    const secondaryRows = secondaryEntry?.rows ?? [];
    const rows = [];

    let prevSection = null;
    let cuttingPrevArea = '0.000';
    let fillingPrevArea = '0.000';

    const totals = {
      totalCuttingVolume: 0,
      totalFillingVolume: 0,
    };

    // Process only "Chainage" rows
    initialRows
      .filter((row) => row.type === 'Chainage')
      .forEach((row) => {
        const secondaryRow = secondaryRows?.find(
          (p) => p.chainage === row.chainage
        );
        const chainage = row.chainage?.split('/')?.[1] ?? '';

        // --- Compute area for each offset ---
        const data = (row?.offsets ?? []).map((entry, idx) => {
          const initRL = Number(row?.reducedLevels?.[idx] ?? 0);
          const propRL = Number(secondaryRow?.reducedLevels?.[idx] ?? 0);
          const offsetVal = Number(entry);
          const prevOffsetVal = Number(row?.offsets?.[idx - 1] ?? 0);

          const isCutting = initRL > propRL;
          const widthMtr =
            idx === 0 ? 0 : (prevOffsetVal - offsetVal).toFixed(3);

          const cuttingAvgMtr = isCutting
            ? ((initRL + propRL) / 2).toFixed(3)
            : '0.000';

          const fillingAvgMtr = isCutting
            ? '0.000'
            : ((propRL + initRL) / 2).toFixed(3);

          return {
            cuttingAreaSqMtr: (
              Number(cuttingAvgMtr) * Number(widthMtr)
            ).toFixed(3),
            fillingAreaSqMtr: (
              Number(fillingAvgMtr) * Number(widthMtr)
            ).toFixed(3),
          };
        });

        // --- Total area for this section ---
        const cuttingAreaSqMtr = data.reduce(
          (acc, curr) => acc + Number(curr.cuttingAreaSqMtr || 0),
          0
        );
        const fillingAreaSqMtr = data.reduce(
          (acc, curr) => acc + Number(curr.fillingAreaSqMtr || 0),
          0
        );

        // --- Compute chainage difference ---
        const currentChainage = Number(chainage) || 0;
        const prevChainage = Number(prevSection) || 0;
        const difference = prevSection
          ? (currentChainage - prevChainage).toFixed(3)
          : '0.000';

        // --- Average areas ---
        const cuttingAvgSqrMtr = (
          (Number(cuttingAreaSqMtr) + Number(cuttingPrevArea)) /
          2
        ).toFixed(3);
        const fillingAvgSqrMtr = (
          (Number(fillingAreaSqMtr) + Number(fillingPrevArea)) /
          2
        ).toFixed(3);

        // --- Volumes ---
        const cuttingVolumeCubicMtr = (
          Number(difference) * Number(cuttingAvgSqrMtr)
        ).toFixed(3);
        const fillingVolumeCubicMtr = (
          Number(difference) * Number(fillingAvgSqrMtr)
        ).toFixed(3);

        // --- Push row ---
        rows.push({
          section: currentChainage.toFixed(3),
          prevSection: prevSection ? prevChainage.toFixed(3) : '-',
          difference,
          width: row?.roadWidth ?? '-',
          cuttingAreaSqMtr: cuttingAreaSqMtr.toFixed(3),
          cuttingPrevArea,
          cuttingAvgSqrMtr,
          cuttingVolumeCubicMtr,
          fillingAreaSqMtr: fillingAreaSqMtr.toFixed(3),
          fillingPrevArea,
          fillingAvgSqrMtr,
          fillingVolumeCubicMtr,
        });

        // --- Prepare for next iteration ---
        cuttingPrevArea = Number(cuttingAreaSqMtr)?.toFixed(3);
        fillingPrevArea = Number(fillingAreaSqMtr)?.toFixed(3);
        totals.totalCuttingVolume += Number(cuttingVolumeCubicMtr);
        totals.totalFillingVolume += Number(fillingVolumeCubicMtr);
        prevSection = chainage;
      });

    return { ...totals, rows };
  }, [survey]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Volume Report');

    // ===== Title =====
    sheet.mergeCells('A1:M1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Volume Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // ===== Set column widths =====
    sheet.getColumn('A').width = 100 / 7; // or 14.3

    // ===== Header Rows =====
    sheet.addRow([
      'Sl.No.',
      'Section From',
      'Previous Section',
      'Difference',
      'Width',
      'Cutting Volume',
      '',
      '',
      '',
      'Filling Volume',
      '',
      '',
      '',
    ]);

    sheet.addRow([
      '',
      '',
      '',
      '',
      '',
      'Area Sq. Mtrs',
      'Previous Area',
      'Average Sq. Mtrs',
      'Volume Cubic Meters',
      'Area Sq. Mtrs',
      'Previous Area',
      'Average Sq. Mtrs',
      'Volume Cubic Meters',
    ]);

    // ===== Merge Header Cells =====
    sheet.mergeCells('F2:I2'); // Cutting Area
    sheet.mergeCells('J2:M2'); // Filling Area

    // ===== Style Headers =====
    const headerRows = [2, 3];
    headerRows.forEach((r) => {
      const row = sheet.getRow(r);
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: '000000' } };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        };
      });
    });

    // ===== Data =====
    let currentRow = 3;

    tableData?.rows?.forEach((entry, idx) => {
      // Data rows
      const dataRow = sheet.addRow([
        idx + 1,
        entry.section,
        entry.prevSection,
        entry.difference,
        entry.width,
        entry.cuttingAreaSqMtr,
        entry.cuttingPrevArea,
        entry.cuttingAvgSqrMtr,
        entry.cuttingVolumeCubicMtr,
        entry.fillingAreaSqMtr,
        entry.fillingPrevArea,
        entry.fillingAvgSqrMtr,
        entry.fillingVolumeCubicMtr,
      ]);

      dataRow.eachCell((cell, colNumber) => {
        // Common border + alignment for all cells
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      currentRow++;
    });

    // Totals Row
    const totalRow = sheet.addRow([
      '',
      '',
      '',
      '',
      '',
      'Total',
      '',
      '',
      Number(tableData?.totalCuttingVolume)?.toFixed(3),
      '',
      '',
      '',
      Number(tableData?.totalFillingVolume)?.toFixed(3),
    ]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;

    // Empty row between sections
    sheet.addRow([]);
    currentRow++;

    // ===== Column Widths =====
    const colWidths = [8, 16, 18, 18, 14, 14, 14, 14, 14, 14, 14, 14, 14];
    colWidths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

    // ===== Save File =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Volume_Report.xlsx');
  };

  useEffect(() => {
    fetchSurvey();
  }, []);

  return (
    <Box p={2}>
      <Stack direction={'row'} spacing={2} mb={2}>
        <Box
          sx={{
            border: '1px solid #EFEFEF',
            borderRadius: '9px',
            width: '40px',
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            mb: '24px',
          }}
          onClick={() => navigate(-1)}
        >
          <MdArrowBackIosNew />
        </Box>

        <BasicButtons
          variant="contained"
          sx={{ mb: 2 }}
          onClick={exportToExcel}
          value="Download Excel 📥"
        />
      </Stack>

      <Typography
        variant="h6"
        fontSize={18}
        fontWeight={700}
        align="center"
        mb={2}
      >
        Volume Report
        {reportDetails.current.initialEntry} and{' '}
        {reportDetails.current.secondaryEntry}
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: '90vh' }}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead
            sx={{
              backgroundColor: '#f4f6f8',
              '& .MuiTableCell-root': {
                border: '1px solid rgba(224, 224, 224, 1)',
                fontWeight: 700,
              },
              position: 'sticky',
              top: 0,
            }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Sl.No.
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Section From
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Previous Section
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Difference
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Width
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                Cutting Volume
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                Filling Volume
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Area Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Previous Area</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Average Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                Volume Cubic Meters
              </TableCell>

              <TableCell sx={{ fontWeight: 700 }}>Area Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Previous Area</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Average Sq. Mtrs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                Volume Cubic Meters
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tableData?.rows?.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.section}</TableCell>
                <TableCell>{row.prevSection}</TableCell>
                <TableCell>{row.difference}</TableCell>
                <TableCell>{row.width}</TableCell>
                <TableCell>{row.cuttingAreaSqMtr}</TableCell>
                <TableCell>{row.cuttingPrevArea}</TableCell>
                <TableCell>{row.cuttingAvgSqrMtr}</TableCell>
                <TableCell>{row.cuttingVolumeCubicMtr}</TableCell>
                <TableCell>{row.fillingAreaSqMtr}</TableCell>
                <TableCell>{row.fillingPrevArea}</TableCell>
                <TableCell>{row.fillingAvgSqrMtr}</TableCell>
                <TableCell>{row.fillingVolumeCubicMtr}</TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={5}></TableCell>

              <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                Total
              </TableCell>

              <TableCell sx={{ fontWeight: 'bold' }}>
                {Number(tableData?.totalCuttingVolume)?.toFixed(3)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>

              <TableCell sx={{ fontWeight: 'bold' }}>
                {Number(tableData?.totalFillingVolume)?.toFixed(3)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VolumeReport;
