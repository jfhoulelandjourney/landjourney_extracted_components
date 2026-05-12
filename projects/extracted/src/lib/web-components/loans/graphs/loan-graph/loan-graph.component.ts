
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnChanges,
  signal,
} from '@angular/core';
import { EChartsOption, graphic } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DetailedLoanCompoundSchema } from '../../../../services/lending/models/loans.models';
import { formatAmountFromCents } from '../../../../utils/numberUtil';
import {
  formatDate,
  readableDateFromTimestamp,
} from '../../../../utils/timeUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-graph',
  templateUrl: './loan-graph.component.html',
  styleUrls: ['./loan-graph.component.scss'],
  imports: [NgxEchartsDirective],
  providers: [provideEcharts()],
})
export class LoanGraphComponent implements OnChanges {
  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  formatDate = readableDateFromTimestamp;
  loan = input<DetailedLoanCompoundSchema | undefined>();

  chartOption: EChartsOption = {};
  lastAmount = signal<number | undefined>(undefined);
  lastDate = signal<string | undefined>(undefined);

  ngOnChanges() {
    if (this.loan()) {
      const histories = Object.keys(this.loan()?.principalBalanceHistory ?? {})
        .map(key => ({
          date: new Date(Number(key) * 1000),
          value: this.loan()?.principalBalanceHistory[key] ?? 0,
        }))
        .sort((v1, v2) => (v1.date < v2.date ? -1 : 1));
      const dates = histories.map(history => formatDate(history.date, 'short'));
      const amounts = histories.map(history => history.value / 100);

      this.lastAmount.set(amounts[amounts.length - 1]);
      this.lastDate.set(dates[dates.length - 1]);

      this.chartOption = {
        grid: {
          left: 0,
          top: 10,
          right: 10,
          bottom: 0,
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'none',
          },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          valueFormatter: value => this.formatAmount(value as number),
          textStyle: {
            fontFamily: 'Montserrat',
            fontSize: 10,
          },
        },
        xAxis: {
          show: true,
          data: dates,
          boundaryGap: false,
          axisLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisPointer: {
            snap: true,
            lineStyle: {
              color: '#CDCDCD',
              width: 1,
            },
            handle: {
              show: true,
              size: 0,
            },
          },
        },
        yAxis: [
          {
            show: false,
            type: 'value',
          },
        ],
        series: [
          {
            name: 'Principal balance',
            type: 'line',
            step: 'middle',
            markPoint: {
              symbol: 'circle',
              symbolSize: 15,
              label: {
                show: true,
                position: 'top',
                distance: 5,
                color: '#ffffff',
                fontFamily: 'Montserrat',
                fontSize: 11,
                align: 'right',
                lineHeight: 13,
                padding: [0, 10, 0, 0],
                formatter: `{bold|${this.formatAmount(amounts[amounts.length - 1])}}\nPrincipal balance`,
                rich: {
                  bold: {
                    fontWeight: 'bold',
                  },
                },
              },
              data: [
                {
                  name: 'coordinate',
                  coord: [amounts.length - 1, amounts[amounts.length - 1] ?? 0],
                },
              ],
            },
            data: amounts,
            itemStyle: {
              color: '#d9d9d9',
            },
            areaStyle: {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgba(217,217,217,0.8)',
                },
                {
                  offset: 1,
                  color: 'rgba(217,217,217,0.1)',
                },
              ]),
            },
          },
        ],
      };
    }
  }
}
