import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { IAMService } from '../../../services/identity/iam.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import {
  OfferStatus,
  type Offer,
} from '../../../services/products/offers.service';
import { OfferStatusBannerComponent } from './offer-status-banner.component';

const iamStub = {
  getUserBasicInfo: () => ({
    id: 'user-1',
    firstName: 'Pat',
    lastName: 'Smith',
  }),
} as unknown as IAMService;

const organizationStub = {
  getUserById: () => null,
  getUserBasicInfoById: () => null,
} as unknown as OrganizationService;

const baseOffer = (overrides: Partial<Offer>): Offer =>
  ({
    id: 'offer-1',
    name: 'Operating line of credit',
    requestId: 'req-42',
    status: OfferStatus.DRAFT,
    ...overrides,
  } as Offer);

const meta: Meta<OfferStatusBannerComponent> = {
  title: 'Web Components/Feedback/Offer Status Banner',
  component: OfferStatusBannerComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: IAMService, useValue: iamStub },
        { provide: OrganizationService, useValue: organizationStub },
      ],
    }),
  ],
  argTypes: {
    isClient: { control: 'boolean' },
    isMobile: { control: 'boolean' },
    noLinkButton: { control: 'boolean' },
    createLoan: { action: 'createLoan' },
  },
};

export default meta;
type Story = StoryObj<OfferStatusBannerComponent>;

export const Draft: Story = {
  args: { offer: baseOffer({ status: OfferStatus.DRAFT }) },
};

export const Underwriting: Story = {
  args: {
    offer: baseOffer({
      status: OfferStatus.UNDERWRITING,
      sentToUnderwritingAt: new Date(),
      sentToUnderwritingBy: 'user-2',
    }),
  },
};

export const SentToApplicant: Story = {
  args: {
    offer: baseOffer({
      status: OfferStatus.APPLICANT,
      sentToApplicantAt: new Date(),
      sentToApplicantBy: 'user-2',
    }),
  },
};

export const Approved: Story = {
  args: {
    offer: baseOffer({
      status: OfferStatus.APPROVED,
      clientApprovedAt: new Date(),
      clientApprovedBy: 'user-1',
    }),
  },
};

export const RejectedByClient: Story = {
  args: {
    offer: baseOffer({ status: OfferStatus.REJECTED_BY_CLIENT }),
  },
};

export const ClientView: Story = {
  args: {
    isClient: true,
    offer: baseOffer({ status: OfferStatus.APPLICANT }),
  },
};
