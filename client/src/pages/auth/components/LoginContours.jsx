import { useReducedMotion } from "framer-motion";
import "./loginContours.css";

// Traced in the reference image's coordinate space so the open center and
// the asymmetric contour banks retain their proportions at every size.
const leftContours = [
  "M-20 156 C44 157 87 184 113 222 C151 278 134 341 105 407 C75 475 70 531 113 574 C160 624 248 608 310 628 C401 655 395 757 447 811 C502 868 610 868 647 956",
  "M-20 212 C38 217 75 241 90 280 C110 334 71 392 55 456 C37 525 47 571 86 610 C142 659 245 643 310 669 C387 700 384 777 432 822 C503 890 551 889 582 956",
  "M-20 261 C21 265 45 289 50 325 C60 377 29 433 25 491 C18 559 35 603 77 638 C134 686 251 672 310 710 C365 746 359 800 409 850 C462 900 491 922 509 956",
  "M-20 295 C11 309 25 337 23 372 C22 416 1 456 -4 505 C-13 577 6 625 53 659 C117 704 238 695 288 745 C345 799 335 829 379 874 C414 910 441 927 461 956",
  "M-30 648 C34 733 164 687 247 725 S335 817 385 873 S448 919 469 970",
  "M-20 747 C44 778 108 778 167 789 C209 797 235 817 257 840 C287 873 324 916 384 956",
  "M-30 811 C69 804 169 840 213 883 S245 926 269 970",
];
const upperContours = [
  "M1078 -20 C1080 27 1106 47 1148 74 C1228 126 1288 176 1341 233 C1416 314 1535 350 1692 357",
  "M1155 -20 C1159 35 1191 66 1244 103 C1306 146 1349 162 1387 207 C1427 255 1468 289 1530 314 C1582 338 1641 350 1692 355",
  "M1217 -20 C1234 29 1258 61 1299 94 C1358 143 1395 147 1431 182 C1468 218 1492 260 1550 283 C1594 299 1648 304 1692 306",
  "M1280 -20 C1296 22 1322 54 1363 83 C1424 131 1480 149 1534 178 C1583 206 1631 218 1692 212",
  "M1320 -20 C1338 36 1372 77 1414 106 C1432 121 1449 138 1461 153 C1492 184 1537 212 1575 236 C1609 260 1653 265 1692 261",
  "M1388 -20 C1415 42 1454 87 1508 116 C1571 151 1634 167 1692 165",
  "M1450 -20 C1477 36 1501 69 1545 94 C1591 121 1637 125 1692 115",
];
const lowerContours = [
  "M1386 961 C1424 930 1448 889 1476 853 C1501 821 1516 780 1530 742 C1546 699 1564 655 1599 627 C1626 606 1658 593 1692 585",
  "M1430 971 C1474 916 1524 864 1554 805 S1592 659 1702 632",
  "M1472 971 C1498 913 1556 886 1591 836 S1609 725 1702 692",
  "M1515 971 C1528 921 1585 902 1616 856 S1643 748 1702 738",
  "M1584 971 C1630 917 1663 868 1702 847",
];
const dashedContours = [
  "M-30 99 C128 93 220 151 199 262 S86 412 139 506 S330 559 440 650 S663 714 789 775 S1014 927 1153 951",
  "M570 -20 C449 66 410 137 361 220 S176 331 176 436 S264 556 334 510 C404 464 461 568 536 658 C624 764 769 806 851 871 C883 897 908 931 925 970",
  "M490 -20 C515 47 568 280 627 197 C702 92 820 -2 959 31 S1154 103 1251 189 S1451 387 1702 415",
  "M-30 669 C53 767 180 735 237 782 S308 895 374 950",
  "M-30 465 C164 392 436 604 793 702 C935 741 1029 842 1123 882 S1340 898 1397 823 S1477 589 1610 555 S1683 548 1702 543",
  "M1567 -30 C1574 44 1588 77 1702 69",
];

const innerContours = [
  "M752 -20 C710 20 668 46 626 79 C581 115 542 145 513 177 C446 249 414 312 343 354 C286 388 227 434 241 471 C252 501 285 492 310 482 C390 450 413 697 497 766 C559 817 645 830 701 862 C744 888 769 922 783 970",
  "M663 -20 C549 64 423 166 351 242 C302 294 220 325 189 388 C166 434 176 477 198 506 C222 536 266 543 310 531 C398 507 447 710 566 775 C632 811 715 828 772 859 C815 883 841 925 861 970",
  "M-30 567 C113 564 257 578 358 635 C459 692 560 742 658 783 C720 809 779 824 827 855 C867 881 889 921 907 970",
];
// Use the same path data for the stroke and light so they never drift apart.
const lights = [
  { path: leftContours[0], position: [113, 222], duration: 36, phase: 2 },
  { path: innerContours[1], position: [198, 506], duration: 40, phase: 8 },
  { path: innerContours[0], position: [626, 79], duration: 40, phase: 2 },
  { path: upperContours[4], position: [1461, 153], duration: 24, phase: 5 },
  { path: upperContours[1], position: [1530, 314], duration: 28, phase: 9 },
  { path: lowerContours[0], position: [1530, 742], duration: 24, phase: 5 },
  { path: leftContours[5], position: [257, 840], duration: 24, phase: 8 },
];

// A portrait composition keeps the curves at the edges instead of compressing
// the entire desktop drawing into the space behind the mobile form.
const compactContours = [
  "M-30 60 C95 45 181 115 158 217 C144 282 49 318 32 394 C14 468 41 520 -30 586",
  "M-30 103 C67 87 138 139 118 219 C98 287 15 317 -3 391 C-19 449 2 482 -30 523",
  "M-30 151 C43 131 93 167 77 226 C60 281 -9 311 -30 353",
  "M630 390 C535 416 511 479 529 548 C548 622 527 673 469 714 C407 758 406 834 436 930",
  "M630 441 C567 460 550 504 568 559 C591 635 560 701 508 743 C462 780 453 849 483 930",
  "M630 493 C603 514 601 541 613 580 C633 658 598 726 552 769 C514 805 509 868 533 930",
];
const compactDashed = [
  "M-30 16 C128 -1 220 98 200 211 C183 305 86 337 74 411 C60 489 88 549 -30 630",
  "M630 339 C493 368 467 466 486 544 C503 611 479 639 427 678 C346 739 358 849 386 930",
];

export default function LoginContours() {
  const reduceMotion = useReducedMotion();
  return (
    <>
    <svg className="login-contours login-contours-desktop" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g className="login-contours-bank login-contours-left">
        {leftContours.map((d) => <path key={d} d={d} />)}
      </g>
      <g className="login-contours-bank login-contours-upper">
        {upperContours.map((d) => <path key={d} d={d} />)}
      </g>
      <g className="login-contours-bank login-contours-lower">
        {lowerContours.map((d) => <path key={d} d={d} />)}
      </g>
      <g className="login-contours-dashed">
        {dashedContours.map((d) => <path key={d} d={d} />)}
      </g>
      <g className="login-contours-interior">
        {innerContours.map((d) => <path key={d} d={d} />)}
      </g>
      {lights.map(({ path, position, duration, phase }, index) => (
        <g key={path} transform={reduceMotion ? `translate(${position.join(" ")})` : undefined}>
          {!reduceMotion && (
            <animateMotion path={path} dur={`${duration}s`} begin={`-${phase}s`} repeatCount="indefinite" calcMode="linear" keyPoints="0;1;0" keyTimes="0;0.5;1" />
          )}
          <g className="login-contour-point" style={{ animationDelay: `${index * -.7}s` }}>
            <circle className="login-contour-halo" r="10" />
            <circle className="login-contour-core" r="4.2" />
          </g>
        </g>
      ))}
    </svg>
    <svg className="login-contours login-contours-compact" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g className="login-contours-bank">
        {compactContours.map((d) => <path key={d} d={d} />)}
      </g>
      <g className="login-contours-dashed">
        {compactDashed.map((d) => <path key={d} d={d} />)}
      </g>
      {[0, 3].map((pathIndex, index) => (
        <g key={pathIndex} transform={reduceMotion ? (index === 0 ? "translate(-30 60)" : "translate(630 390)") : undefined}>
          {!reduceMotion && (
            <animateMotion path={compactContours[pathIndex]} dur={`${24 + index * 4}s`} begin={`-${4 + index * 3}s`} repeatCount="indefinite" calcMode="linear" keyPoints="0;1;0" keyTimes="0;0.5;1" />
          )}
          <g className="login-contour-point" style={{ animationDelay: `${index * -1.5}s` }}>
            <circle className="login-contour-halo" r="8" />
            <circle className="login-contour-core" r="3.5" />
          </g>
        </g>
      ))}
    </svg>
    </>
  );
}
