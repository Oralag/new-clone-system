--
-- PostgreSQL database dump
--

\restrict T6UQFyQuKvKhfCmFIt6ZcfMNKOsoYRlsIhA5ThPaPHVgrGne7kTmBMh2Ui42ezW

-- Dumped from database version 17.8 (a284a84)
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying NOT NULL,
    account character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    avatar character varying(500) DEFAULT ''::character varying,
    role_name character varying(50) DEFAULT '管理员'::character varying,
    role_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: collect_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.collect_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    contact_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    receipt_date date,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.collect_receipt OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.collect_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collect_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.collect_receipt_id_seq OWNED BY public.collect_receipt.id;


--
-- Name: company_info; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_info (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    logo character varying(500) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    tel character varying(50) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text
);


ALTER TABLE public.company_info OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.company_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_info_id_seq OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.company_info_id_seq OWNED BY public.company_info.id;


--
-- Name: depts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.depts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.depts OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.depts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.depts_id_seq OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.depts_id_seq OWNED BY public.depts.id;


--
-- Name: finance_costs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_costs (
    id integer NOT NULL,
    cost_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    cost_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_costs OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_costs_id_seq OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_costs_id_seq OWNED BY public.finance_costs.id;


--
-- Name: finance_expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_expenses (
    id integer NOT NULL,
    expense_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    expense_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_expenses OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_expenses_id_seq OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_expenses_id_seq OWNED BY public.finance_expenses.id;


--
-- Name: finance_funds; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_funds (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    fund_type integer DEFAULT 1,
    balance numeric(10,2) DEFAULT 0,
    bank_name character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_funds OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_funds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_funds_id_seq OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_funds_id_seq OWNED BY public.finance_funds.id;


--
-- Name: finance_invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_invoices (
    id integer NOT NULL,
    invoice_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    invoice_date date,
    type integer DEFAULT 1,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_invoices OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_invoices_id_seq OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_invoices_id_seq OWNED BY public.finance_invoices.id;


--
-- Name: finance_payable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_payable (
    id integer NOT NULL,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_payable OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_payable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_payable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_payable_id_seq OWNED BY public.finance_payable.id;


--
-- Name: finance_receivable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_receivable (
    id integer NOT NULL,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    total_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_receivable OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_receivable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_receivable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_receivable_id_seq OWNED BY public.finance_receivable.id;


--
-- Name: finance_statements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_statements (
    id integer NOT NULL,
    statement_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    start_date date,
    end_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_statements OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_statements_id_seq OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_statements_id_seq OWNED BY public.finance_statements.id;


--
-- Name: goods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    code character varying(100) DEFAULT ''::character varying,
    cate_id integer DEFAULT 0,
    cate_name character varying(100) DEFAULT ''::character varying,
    unit_id integer DEFAULT 0,
    unit_name character varying(50) DEFAULT ''::character varying,
    brand_id integer DEFAULT 0,
    brand_name character varying(100) DEFAULT ''::character varying,
    spec text DEFAULT ''::text,
    price numeric(10,2) DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    max_stock integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    images text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    goods_name character varying(200) DEFAULT ''::character varying NOT NULL,
    goods_sn character varying(100) DEFAULT ''::character varying,
    en_name character varying(200) DEFAULT ''::character varying,
    goods_memo character varying(200) DEFAULT ''::character varying,
    goods_type integer DEFAULT 1,
    sell_price numeric(10,2) DEFAULT 0,
    cost_price numeric(10,2) DEFAULT 0,
    barcode character varying(100) DEFAULT ''::character varying,
    safe_min integer DEFAULT 0,
    safe_max integer DEFAULT 0,
    sort integer DEFAULT 0,
    make_time integer DEFAULT 0,
    can_sale integer DEFAULT 1,
    can_buy integer DEFAULT 1,
    can_make integer DEFAULT 1,
    can_outsource integer DEFAULT 1,
    multi_unit boolean DEFAULT false,
    multi_spec boolean DEFAULT false
);


ALTER TABLE public.goods OWNER TO neondb_owner;

--
-- Name: goods_brand; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_brand (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_brand OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_brand_id_seq OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_brand_id_seq OWNED BY public.goods_brand.id;


--
-- Name: goods_cate; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_cate (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_cate OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_cate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_cate_id_seq OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_cate_id_seq OWNED BY public.goods_cate.id;


--
-- Name: goods_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_id_seq OWNER TO neondb_owner;

--
-- Name: goods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_id_seq OWNED BY public.goods.id;


--
-- Name: goods_spec; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_spec (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "values" text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_spec OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_spec_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_spec_id_seq OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_spec_id_seq OWNED BY public.goods_spec.id;


--
-- Name: goods_unit; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_unit (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_unit OWNER TO neondb_owner;

--
-- Name: goods_unit_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_unit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_unit_id_seq OWNER TO neondb_owner;

--
-- Name: goods_unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_unit_id_seq OWNED BY public.goods_unit.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    dept_id integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.jobs OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: operation_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.operation_logs (
    id integer NOT NULL,
    admin_id integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    action character varying(200) DEFAULT ''::character varying,
    ip character varying(50) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.operation_logs OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.operation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operation_logs_id_seq OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.operation_logs_id_seq OWNED BY public.operation_logs.id;


--
-- Name: pay_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pay_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    contact_type character varying(50) DEFAULT 'supplier'::character varying,
    contact_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.pay_receipt OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pay_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pay_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pay_receipt_id_seq OWNED BY public.pay_receipt.id;


--
-- Name: prepay_record; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prepay_record (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.prepay_record OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prepay_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prepay_record_id_seq OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prepay_record_id_seq OWNED BY public.prepay_record.id;


--
-- Name: procure_inhouse; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_inhouse (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    purchase_order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    in_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_inhouse OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_inhouse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_inhouse_id_seq OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_inhouse_id_seq OWNED BY public.procure_inhouse.id;


--
-- Name: procure_plan; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_plan (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    plan_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_plan OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_plan_id_seq OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_plan_id_seq OWNED BY public.procure_plan.id;


--
-- Name: procure_return; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_return (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    return_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_return OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_return_id_seq OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_return_id_seq OWNED BY public.procure_return.id;


--
-- Name: purchase_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    freight_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.purchase_order OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchase_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_id_seq OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchase_order_id_seq OWNED BY public.purchase_order.id;


--
-- Name: retail_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_members (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    gender integer DEFAULT 0,
    birthday date,
    balance numeric(10,2) DEFAULT 0,
    points integer DEFAULT 0,
    level character varying(50) DEFAULT '普通会员'::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_members OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_members_id_seq OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_members_id_seq OWNED BY public.retail_members.id;


--
-- Name: retail_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_orders (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    pay_type character varying(50) DEFAULT ''::character varying,
    order_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_orders OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_orders_id_seq OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_orders_id_seq OWNED BY public.retail_orders.id;


--
-- Name: retail_recharge; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_recharge (
    id integer NOT NULL,
    recharge_no character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_recharge OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_recharge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_recharge_id_seq OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_recharge_id_seq OWNED BY public.retail_recharge.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    permissions text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sale_contracts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_contracts (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_contracts OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_contracts_id_seq OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_contracts_id_seq OWNED BY public.sale_contracts.id;


--
-- Name: sale_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_customers (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    nickname character varying(100) DEFAULT ''::character varying,
    code character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    tel character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    contact character varying(100) DEFAULT ''::character varying,
    level_name character varying(50) DEFAULT '普通客户'::character varying,
    source_name character varying(50) DEFAULT ''::character varying,
    level_id integer DEFAULT 0,
    source_id integer DEFAULT 0,
    follow_admin_id integer DEFAULT 0,
    follow_admin character varying(50) DEFAULT ''::character varying,
    balance numeric(10,2) DEFAULT 0,
    is_sea integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_customers OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_customers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_customers_id_seq OWNED BY public.sale_customers.id;


--
-- Name: sale_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_offers (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    offer_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_offers OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_offers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_offers_id_seq OWNED BY public.sale_offers.id;


--
-- Name: sale_out_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_out_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    out_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_out_order OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_out_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_out_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_out_order_id_seq OWNED BY public.sale_out_order.id;


--
-- Name: sale_return_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_return_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    return_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_return_order OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_return_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_return_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_return_order_id_seq OWNED BY public.sale_return_order.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    job_id integer DEFAULT 0,
    job_name character varying(100) DEFAULT ''::character varying,
    entry_date date,
    gender integer DEFAULT 1,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: stock_checks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_checks (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_checks OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_checks_id_seq OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_checks_id_seq OWNED BY public.stock_checks.id;


--
-- Name: stock_flow; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_flow (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    type character varying(50) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    before_qty integer DEFAULT 0,
    after_qty integer DEFAULT 0,
    order_no character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_flow OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_flow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_flow_id_seq OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_flow_id_seq OWNED BY public.stock_flow.id;


--
-- Name: stock_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_inventory (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    goods_code character varying(100) DEFAULT ''::character varying,
    unit_name character varying(50) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    update_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_inventory OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_inventory_id_seq OWNED BY public.stock_inventory.id;


--
-- Name: stock_other_in; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_in (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_in OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_in_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_in_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_in_id_seq OWNED BY public.stock_other_in.id;


--
-- Name: stock_other_out; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_out (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_out OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_out_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_out_id_seq OWNED BY public.stock_other_out.id;


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.supplier (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    contact character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    bank character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.supplier OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_id_seq OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.supplier_id_seq OWNED BY public.supplier.id;


--
-- Name: sys_params; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sys_params (
    id integer NOT NULL,
    key character varying(100),
    value text DEFAULT ''::text,
    remark text DEFAULT ''::text
);


ALTER TABLE public.sys_params OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sys_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_params_id_seq OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sys_params_id_seq OWNED BY public.sys_params.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address text DEFAULT ''::text,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.warehouses OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: collect_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt ALTER COLUMN id SET DEFAULT nextval('public.collect_receipt_id_seq'::regclass);


--
-- Name: company_info id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info ALTER COLUMN id SET DEFAULT nextval('public.company_info_id_seq'::regclass);


--
-- Name: depts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts ALTER COLUMN id SET DEFAULT nextval('public.depts_id_seq'::regclass);


--
-- Name: finance_costs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs ALTER COLUMN id SET DEFAULT nextval('public.finance_costs_id_seq'::regclass);


--
-- Name: finance_expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses ALTER COLUMN id SET DEFAULT nextval('public.finance_expenses_id_seq'::regclass);


--
-- Name: finance_funds id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds ALTER COLUMN id SET DEFAULT nextval('public.finance_funds_id_seq'::regclass);


--
-- Name: finance_invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices ALTER COLUMN id SET DEFAULT nextval('public.finance_invoices_id_seq'::regclass);


--
-- Name: finance_payable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable ALTER COLUMN id SET DEFAULT nextval('public.finance_payable_id_seq'::regclass);


--
-- Name: finance_receivable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable ALTER COLUMN id SET DEFAULT nextval('public.finance_receivable_id_seq'::regclass);


--
-- Name: finance_statements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements ALTER COLUMN id SET DEFAULT nextval('public.finance_statements_id_seq'::regclass);


--
-- Name: goods id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods ALTER COLUMN id SET DEFAULT nextval('public.goods_id_seq'::regclass);


--
-- Name: goods_brand id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand ALTER COLUMN id SET DEFAULT nextval('public.goods_brand_id_seq'::regclass);


--
-- Name: goods_cate id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate ALTER COLUMN id SET DEFAULT nextval('public.goods_cate_id_seq'::regclass);


--
-- Name: goods_spec id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec ALTER COLUMN id SET DEFAULT nextval('public.goods_spec_id_seq'::regclass);


--
-- Name: goods_unit id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit ALTER COLUMN id SET DEFAULT nextval('public.goods_unit_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: operation_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs ALTER COLUMN id SET DEFAULT nextval('public.operation_logs_id_seq'::regclass);


--
-- Name: pay_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt ALTER COLUMN id SET DEFAULT nextval('public.pay_receipt_id_seq'::regclass);


--
-- Name: prepay_record id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record ALTER COLUMN id SET DEFAULT nextval('public.prepay_record_id_seq'::regclass);


--
-- Name: procure_inhouse id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse ALTER COLUMN id SET DEFAULT nextval('public.procure_inhouse_id_seq'::regclass);


--
-- Name: procure_plan id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan ALTER COLUMN id SET DEFAULT nextval('public.procure_plan_id_seq'::regclass);


--
-- Name: procure_return id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return ALTER COLUMN id SET DEFAULT nextval('public.procure_return_id_seq'::regclass);


--
-- Name: purchase_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_id_seq'::regclass);


--
-- Name: retail_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members ALTER COLUMN id SET DEFAULT nextval('public.retail_members_id_seq'::regclass);


--
-- Name: retail_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders ALTER COLUMN id SET DEFAULT nextval('public.retail_orders_id_seq'::regclass);


--
-- Name: retail_recharge id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge ALTER COLUMN id SET DEFAULT nextval('public.retail_recharge_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sale_contracts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts ALTER COLUMN id SET DEFAULT nextval('public.sale_contracts_id_seq'::regclass);


--
-- Name: sale_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers ALTER COLUMN id SET DEFAULT nextval('public.sale_customers_id_seq'::regclass);


--
-- Name: sale_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers ALTER COLUMN id SET DEFAULT nextval('public.sale_offers_id_seq'::regclass);


--
-- Name: sale_out_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order ALTER COLUMN id SET DEFAULT nextval('public.sale_out_order_id_seq'::regclass);


--
-- Name: sale_return_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order ALTER COLUMN id SET DEFAULT nextval('public.sale_return_order_id_seq'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- Name: stock_checks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks ALTER COLUMN id SET DEFAULT nextval('public.stock_checks_id_seq'::regclass);


--
-- Name: stock_flow id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow ALTER COLUMN id SET DEFAULT nextval('public.stock_flow_id_seq'::regclass);


--
-- Name: stock_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory ALTER COLUMN id SET DEFAULT nextval('public.stock_inventory_id_seq'::regclass);


--
-- Name: stock_other_in id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in ALTER COLUMN id SET DEFAULT nextval('public.stock_other_in_id_seq'::regclass);


--
-- Name: stock_other_out id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out ALTER COLUMN id SET DEFAULT nextval('public.stock_other_out_id_seq'::regclass);


--
-- Name: supplier id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier ALTER COLUMN id SET DEFAULT nextval('public.supplier_id_seq'::regclass);


--
-- Name: sys_params id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params ALTER COLUMN id SET DEFAULT nextval('public.sys_params_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, name, account, password, avatar, role_name, role_id, dept_name, dept_id, mobile, email, status, remark, create_time, update_time, deleted_at) FROM stdin;
1	管理员	17747344571	Oral6421		超级管理员	0		0			1		2026-03-28 12:40:01.408684	2026-03-28 12:40:01.408684	\N
2	管理员	admin	123456		超级管理员	0		0			1		2026-03-28 13:04:00.311975	2026-03-28 13:04:00.311975	\N
29	测试员工	test_staff_001	$2a$10$bKTSe5RPacbm3Q1RGHX2k.bY7C0a4sA4cdY9qFLJE4e5MHAvaI.Qu		管理员	0		0	13800000001		1		2026-03-29 16:04:41.972514	2026-03-29 16:04:41.972514	2026-03-29 16:05:10.104557
30	测试员工2	staff_1774800364	$2a$10$RoFdTN.1y5FSf9ahaoK5ve1F7LRJIeUhcT4UEyEM5lFXr9mM74qGK		管理员	0		0	13800000002		1		2026-03-29 16:06:06.366732	2026-03-29 16:06:06.366732	\N
\.


--
-- Data for Name: collect_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.collect_receipt (id, receipt_no, order_sn, customer_id, customer_name, contact_name, amount, receipt_date, pay_type, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: company_info; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_info (id, name, logo, address, tel, email, remark) FROM stdin;
1	我的公司					
\.


--
-- Data for Name: depts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.depts (id, name, parent_id, sort, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_costs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_costs (id, cost_no, name, amount, cost_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_expenses (id, expense_no, name, amount, expense_date, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_funds; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_funds (id, name, fund_type, balance, bank_name, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
6	测试账户DELETE	1	0.00				1	2026-03-29 15:04:21.718196	2026-03-29 15:04:21.718196	2026-03-29 15:05:24.636888
5	道力干记录付款单	1	-205.00				1	2026-03-29 07:56:07.75335	2026-03-29 15:37:30.390586	\N
7	公司支出账户	1	-13007.38				1	2026-03-29 15:37:30.872532	2026-03-29 15:38:02.118225	\N
10	乌日力格/额外支出	1	-11460.00				1	2026-03-29 15:38:12.808151	2026-03-29 15:38:16.346442	\N
9	乌日力格	1	-8611.00				1	2026-03-29 15:38:03.482551	2026-03-29 15:38:19.081903	\N
8	孟根	1	-46129.25				1	2026-03-29 15:37:37.415389	2026-03-29 15:38:19.984219	\N
\.


--
-- Data for Name: finance_invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_invoices (id, invoice_no, customer_id, customer_name, amount, invoice_date, type, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_payable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_payable (id, supplier_id, supplier_name, order_sn, order_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_receivable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_receivable (id, customer_id, customer_name, order_sn, total_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_statements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_statements (id, statement_no, customer_id, customer_name, amount, start_date, end_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: goods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods (id, name, code, cate_id, cate_name, unit_id, unit_name, brand_id, brand_name, spec, price, cost, stock, min_stock, max_stock, remark, status, images, create_time, update_time, deleted_at, goods_name, goods_sn, en_name, goods_memo, goods_type, sell_price, cost_price, barcode, safe_min, safe_max, sort, make_time, can_sale, can_buy, can_make, can_outsource, multi_unit, multi_spec) FROM stdin;
803			167	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:45:50.485118	2026-03-29 06:45:50.485118	\N	炒米/散/巴林	SP0000233			1	7.00	0.00		0	0	0	0	1	1	1	1	f	f
804			167	广告物料	0	瓶	0		1L	0.00	0.00	0	0	0		1		2026-03-29 06:45:51.478038	2026-03-29 06:45:51.478038	\N	德吉酸奶/2斤装	SP0000232			1	18.00	15.00	6900002324565	0	0	0	0	1	1	1	1	f	f
805			167	广告物料	0	瓶	0		500mL	0.00	0.00	0	0	0		1		2026-03-29 06:45:52.387318	2026-03-29 06:45:52.387318	\N	德吉酸奶/一斤装	SP0000231			1	12.00	8.00	6954129710171	0	0	0	0	1	1	1	1	f	f
806			167	广告物料	0	瓶	0		250mL	0.00	0.00	0	0	0		1		2026-03-29 06:45:53.28094	2026-03-29 06:45:53.28094	\N	德吉酸奶/半斤	SP0000230			1	8.00	4.00		0	0	0	0	1	1	1	1	f	f
807			170	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:45:55.547042	2026-03-29 06:45:55.547042	\N	蒙古果/格日勒/大	SP0000229			1	16.00	12.00	6926743385045	0	0	0	0	1	1	1	1	f	f
808			167	广告物料	0	盒	0		100克	0.00	0.00	0	0	0		1		2026-03-29 06:45:56.452492	2026-03-29 06:45:56.452492	\N	彩色奶圈圈	SP0000228			1	15.00	0.00		0	0	0	0	1	1	1	1	f	f
809			170	成品	0	盒	0		10斤装	0.00	0.00	0	0	0		1		2026-03-29 06:45:57.423231	2026-03-29 06:45:57.423231	\N	10斤装/小米/绿色纸盒	SP0000227			1	70.00	65.00		0	0	0	0	1	1	1	1	f	f
810			168	散货	0	散	0		1斤装	0.00	0.00	0	0	0		1		2026-03-29 06:45:58.352636	2026-03-29 06:45:58.352636	\N	乌日莫/奥特尔	SP0000226			1	15.00	12.00		0	0	0	0	1	1	1	1	f	f
811			167	广告物料	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:45:59.242186	2026-03-29 06:45:59.242186	\N	蒙古果子/格日勒	SP0000225			1	10.00	8.00		0	0	0	0	1	1	1	1	f	f
812			167	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:46:00.138942	2026-03-29 06:46:00.138942	\N	花形奶锅巴	SP0000224			1	35.00	0.00		0	0	0	0	1	1	1	1	f	f
813			167	广告物料	0	张	0		大	0.00	0.00	0	0	0		1		2026-03-29 06:46:01.045929	2026-03-29 06:46:01.045929	\N	奶豆腐/超大/乌日汗	SP0000223			1	85.00	60.00	6900002239603	0	0	0	0	1	1	1	1	f	f
814			167	广告物料	0	袋	0		1斤/原味	0.00	0.00	0	0	0		1		2026-03-29 06:46:01.987682	2026-03-29 06:46:01.987682	\N	奥都/真空奶豆腐	SP0000222			1	25.00	0.00		0	0	0	0	1	1	1	1	f	f
815			170	成品	0	瓶	0		大	0.00	0.00	0	0	0		1		2026-03-29 06:46:03.381383	2026-03-29 06:46:03.381383	\N	酸马奶	SP0000221			1	25.00	15.00	6900002213934	0	0	0	0	1	1	1	1	f	f
816			170	成品	0	瓶	0		大	0.00	0.00	0	0	0		1		2026-03-29 06:46:04.950399	2026-03-29 06:46:04.950399	\N	乌日汗大瓶酸奶	SP0000220			1	20.00	16.00	6900002209130	0	0	0	0	1	1	1	1	f	f
817			170	成品	0	瓶	0		小	0.00	0.00	0	0	0		1		2026-03-29 06:46:05.861995	2026-03-29 06:46:05.861995	\N	乌日汗小瓶酸奶	SP0000219			1	8.00	6.00	6903547102122	0	0	0	0	1	1	1	1	f	f
818			171	酒	0	件	0		500ML*4	0.00	0.00	0	0	0		1		2026-03-29 06:46:07.26264	2026-03-29 06:46:07.26264	\N	四季红福	SP0000218			1	120.00	100.00		0	0	0	0	1	1	1	1	f	f
819			171	酒	0	桶	0		2L	0.00	0.00	0	0	0		1		2026-03-29 06:46:08.168863	2026-03-29 06:46:08.168863	\N	红日桶装酒	SP0000217			1	28.00	21.00		0	0	0	0	1	1	1	1	f	f
820			171	酒	0	瓶	0		490mL	0.00	0.00	0	0	0		1		2026-03-29 06:46:09.089646	2026-03-29 06:46:09.089646	\N	天山原浆/小	SP0000216			1	15.00	9.23	6900002169910	0	0	0	0	1	1	1	1	f	f
821			171	酒	0	瓶	0		490mL	0.00	0.00	0	0	0		1		2026-03-29 06:46:10.042136	2026-03-29 06:46:10.042136	\N	天山原浆/大	SP0000215			1	25.00	16.05	6926919861169	0	0	0	0	1	1	1	1	f	f
822			167	广告物料	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:10.970494	2026-03-29 06:46:10.970494	\N	黄油/大瓶/科尔沁	SP0000214			1	30.00	21.00	6907262383018	0	0	0	0	1	1	1	1	f	f
823			167	广告物料	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:11.874816	2026-03-29 06:46:11.874816	\N	黄油/中瓶	SP0000213			1	25.00	15.00		0	0	0	0	1	1	1	1	f	f
824			172	散装	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:46:13.346968	2026-03-29 06:46:13.346968	\N	黄油/散装	SP0000212			1	48.00	22.00		0	0	0	0	1	1	1	1	f	f
825			172	散装	0	盒	0		300ml	0.00	0.00	0	0	0		1		2026-03-29 06:46:14.691322	2026-03-29 06:46:14.691322	\N	故乡宝酸马奶	SP0000211			1	18.00	15.00		0	0	0	0	1	1	1	1	f	f
826			172	散装	0	盒	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:46:15.715184	2026-03-29 06:46:15.715184	\N	乌日汗酸奶	SP0000210			1	15.00	9.00	6900002102839	0	0	0	0	1	1	1	1	f	f
827			175	成品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:46:18.023543	2026-03-29 06:46:18.023543	\N	透明成品/奶锅巴/线下	SP0000209			1	27.00	0.00		0	0	0	0	1	1	1	1	f	f
828			167	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:18.944102	2026-03-29 06:46:18.944102	\N	中等/奶豆腐/	SP0000208			1	32.00	0.00		0	0	0	0	1	1	1	1	f	f
829			167	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:19.857632	2026-03-29 06:46:19.857632	\N	奶豆腐/原味/中/科尔沁	SP0000207			1	25.00	19.00		0	0	0	0	1	1	1	1	f	f
830			167	广告物料	0	袋	0		2.5kg	0.00	0.00	0	0	0		1		2026-03-29 06:46:20.776315	2026-03-29 06:46:20.776315	\N	小米/10斤/小袋	SP0000206			1	22.00	19.00		0	0	0	0	1	1	1	1	f	f
831			170	成品	0	袋	0		1斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:21.672573	2026-03-29 06:46:21.672573	\N	果条/阿润	SP0000205			1	12.00	10.00		0	0	0	0	1	1	1	1	f	f
832			167	广告物料	0	袋	0		100克	0.00	0.00	0	0	0		1		2026-03-29 06:46:22.622511	2026-03-29 06:46:22.622511	\N	8元烤奶皮/成品	SP0000204			1	8.00	0.00		0	0	0	0	1	1	1	1	f	f
833			170	成品	0	袋	0		180	0.00	0.00	0	0	0		1		2026-03-29 06:46:23.576842	2026-03-29 06:46:23.576842	\N	10元/脆香奶条	SP0000203			1	10.00	0.00		0	0	0	0	1	1	1	1	f	f
834			167	广告物料	0	袋	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:24.537651	2026-03-29 06:46:24.537651	\N	新年福字袋/小	SP0000202			1	0.00	0.22		0	0	0	0	1	1	1	1	f	f
835			170	成品	0	散	0		散装	0.00	0.00	0	0	0		1		2026-03-29 06:46:25.464428	2026-03-29 06:46:25.464428	\N	奶果子/小包装/成品	SP0000200			1	50.00	0.00		0	0	0	0	1	1	1	1	f	f
836			178	塑料袋	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:29.95024	2026-03-29 06:46:29.95024	\N	礼盒/2026	SP0000199			1	8.00	5.16		0	0	0	0	1	1	1	1	f	f
837			172	散装	0	袋	0		1一斤	0.00	0.00	0	0	0		1		2026-03-29 06:46:31.020745	2026-03-29 06:46:31.020745	\N	甜味奶豆腐块儿/大	SP0000198			1	35.00	28.00		0	0	0	0	1	1	1	1	f	f
838			180	成品	0	袋	0		2斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:32.937152	2026-03-29 06:46:32.937152	\N	奶粉蒙古国	SP0000197			1	36.00	32.00		0	0	0	0	1	1	1	1	f	f
839			180	成品	0	袋	0		360克	0.00	0.00	0	0	0		1		2026-03-29 06:46:34.281064	2026-03-29 06:46:34.281064	\N	奶皮子粉	SP0000196			1	16.00	12.00		0	0	0	0	1	1	1	1	f	f
840			180	成品	0	盒	0		300克	0.00	0.00	0	0	0		1		2026-03-29 06:46:35.18057	2026-03-29 06:46:35.18057	\N	奶茶粉战粮	SP0000195			1	20.00	15.00		0	0	0	0	1	1	1	1	f	f
842			180	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:37.067494	2026-03-29 06:46:37.067494	\N	努德勒沁调和茶	SP0000193			1	25.00	22.00		0	0	0	0	1	1	1	1	f	f
844			180	成品	0	盒	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:38.927496	2026-03-29 06:46:38.927496	\N	希日嘎拉奶茶专用茶	SP0000191			1	25.00	22.00		0	0	0	0	1	1	1	1	f	f
846			167	广告物料	0	瓶	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:46:40.760643	2026-03-29 06:46:40.760643	\N	酸奶/额吉伊德	SP0000189			1	10.00	6.00		0	0	0	0	1	1	1	1	f	f
848			181	糖果sugar	0	袋	0		净含量172	0.00	0.00	0	0	0		1		2026-03-29 06:46:43.034656	2026-03-29 06:46:43.034656	\N	10元组合糖	SP0000187			1	10.00	6.00	6945391354769	0	0	0	0	1	1	1	1	f	f
850			184	袋子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:46.288178	2026-03-29 06:46:46.288178	\N	红糖袋/delicious	SP0000185			1	0.00	0.00		0	0	0	0	1	1	1	1	f	f
851			170	成品	0	盒	0		3根	0.00	0.00	0	0	0		1		2026-03-29 06:46:47.22213	2026-03-29 06:46:47.22213	\N	晴王糖葫芦	SP0000184			1	0.00	0.00	6957075066268	0	0	0	0	1	1	1	1	f	f
853			170	成品	0	斤	0		香辣	0.00	0.00	0	0	0		1		2026-03-29 06:46:49.040653	2026-03-29 06:46:49.040653	\N	牛肉干/散/香辣	SP0000182			1	115.00	98.00	6900002054622	0	0	0	0	1	1	1	1	f	f
855			167	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:46:50.934138	2026-03-29 06:46:50.934138	\N	奶锅巴/扎旗吉十奶制品	SP0000180			1	28.00	18.00	6937111207251	0	0	0	0	1	1	1	1	f	f
857			167	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:52.743295	2026-03-29 06:46:52.743295	\N	厚奶皮	SP0000178			1	25.00	19.00		0	0	0	0	1	1	1	1	f	f
859			181	糖果sugar	0	斤	0		奶油炒米/  黑芝麻/ 乌日莫糖/ 酸奶炒米/ 奶油花生	0.00	0.00	0	0	0		1		2026-03-29 06:46:54.595963	2026-03-29 06:46:54.595963	\N	糖/阿润	SP0000176			1	35.00	25.00		0	0	0	0	1	1	1	1	f	f
861			172	散装	0	散	0		散称	0.00	0.00	0	0	0		1		2026-03-29 06:46:56.438149	2026-03-29 06:46:56.438149	\N	五香瓜子	SP0000174			1	18.00	15.00	6900001763790	0	0	0	0	1	1	1	1	f	f
863			172	散装	0	个	0		7克/包	0.00	0.00	0	0	0		1		2026-03-29 06:47:00.700348	2026-03-29 06:47:00.700348	\N	冻炒米/小包散/精品	SP0000172			1	0.00	0.22	6922984070163	0	0	0	0	1	1	1	1	f	f
865			170	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:47:02.573843	2026-03-29 06:47:02.573843	\N	牛肉干/和希格图	SP0000170			1	89.00	49.00	6906087912087	0	0	0	0	1	1	1	1	f	f
867			180	成品	0	盒	0		5g/袋泡茶/30泡	0.00	0.00	0	0	0		1		2026-03-29 06:47:04.41107	2026-03-29 06:47:04.41107	\N	5g/青砖袋泡茶	SP0000168			1	28.00	7.96	6980240258574	0	0	0	0	1	1	1	1	f	f
869			180	成品	0	袋	0		450g	0.00	0.00	0	0	0		1		2026-03-29 06:47:06.260498	2026-03-29 06:47:06.260498	\N	青砖碎茶	SP0000166			1	12.00	7.31		0	0	0	0	1	1	1	1	f	f
871			180	成品	0	个	0		380g	0.00	0.00	0	0	0		1		2026-03-29 06:47:08.101844	2026-03-29 06:47:08.101844	\N	小青砖茶砖	SP0000164			1	12.00	7.11	6928141402320	0	0	0	0	1	1	1	1	f	f
874			193	成品	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:47:13.890147	2026-03-29 06:47:13.890147	\N	黄金纬度/牛肉干/成品袋	SP0000161			1	118.00	48.95		0	0	0	0	1	1	1	1	f	f
875			196	定制类产品	0	盒	0		140g	0.00	0.00	0	0	0		1		2026-03-29 06:47:16.184249	2026-03-29 06:47:16.184249	\N	憨野/冻炒米	SP0000160			1	23.50	4.48	6993375937417	0	0	0	0	1	1	1	1	f	f
877			196	定制类产品	0	盒	0		120g/憨野	0.00	0.00	0	0	0		1		2026-03-29 06:47:18.386251	2026-03-29 06:47:18.386251	\N	憨野/奶锅巴/	SP0000158			1	27.00	5.28	6900001584957	0	0	0	0	1	1	1	1	f	f
841			180	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:36.092855	2026-03-29 06:46:36.092855	\N	奶茶粉贡格尔	SP0000194			1	22.00	18.00		0	0	0	0	1	1	1	1	f	f
843			172	散装	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:38.007844	2026-03-29 06:46:38.007844	\N	阿依古丽奶茶专用红茶	SP0000192			1	0.00	0.00		0	0	0	0	1	1	1	1	f	f
845			167	广告物料	0	瓶	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:46:39.821893	2026-03-29 06:46:39.821893	\N	乳清饮料	SP0000190			1	6.00	4.50	6943774380698	0	0	0	0	1	1	1	1	f	f
847			170	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:46:41.675045	2026-03-29 06:46:41.675045	\N	乌日莫/袋装	SP0000188			1	10.00	7.00		0	0	0	0	1	1	1	1	f	f
849			181	糖果sugar	0	袋	0		净含量172	0.00	0.00	0	0	0		1		2026-03-29 06:46:43.975249	2026-03-29 06:46:43.975249	\N	15元组合糖	SP0000186			1	15.00	8.60		0	0	0	0	1	1	1	1	f	f
852			170	成品	0	斤	0		孜然	0.00	0.00	0	0	0		1		2026-03-29 06:46:48.134464	2026-03-29 06:46:48.134464	\N	牛肉干/散/孜然	SP0000183			1	115.00	98.00	6961257264978	0	0	0	0	1	1	1	1	f	f
854			170	成品	0	斤	0		原味	0.00	0.00	0	0	0		1		2026-03-29 06:46:49.989028	2026-03-29 06:46:49.989028	\N	牛肉干/散/原味	SP0000181			1	115.00	98.00	6939980951432	0	0	0	0	1	1	1	1	f	f
856			170	成品	0	张	0		1.2	0.00	0.00	0	0	0		1		2026-03-29 06:46:51.851488	2026-03-29 06:46:51.851488	\N	科尔沁/大奶豆腐	SP0000179			1	48.00	33.00	6974218180685	0	0	0	0	1	1	1	1	f	f
858			170	成品	0	盒	0		3棵	0.00	0.00	0	0	0		1		2026-03-29 06:46:53.65596	2026-03-29 06:46:53.65596	\N	糖葫芦	SP0000177			1	10.00	6.00	6963465779827	0	0	0	0	1	1	1	1	f	f
860			172	散装	0	散	0		散称	0.00	0.00	0	0	0		1		2026-03-29 06:46:55.53842	2026-03-29 06:46:55.53842	\N	普通瓜子	SP0000175			1	12.00	10.00	6915044718067	0	0	0	0	1	1	1	1	f	f
862			187	黄油	0	瓶	0		120mL	0.00	0.00	0	0	0		1		2026-03-29 06:46:59.307415	2026-03-29 06:46:59.307415	\N	专瓶/黄油渣	SP0000173			1	0.00	1.80		0	0	0	0	1	1	1	1	f	f
864			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:01.663181	2026-03-29 06:47:01.663181	\N	礼盒/腰封	SP0000171			1	0.50	0.37		0	0	0	0	1	1	1	1	f	f
866			170	成品	0	瓶	0		400ke	0.00	0.00	0	0	0		1		2026-03-29 06:47:03.500209	2026-03-29 06:47:03.500209	\N	酸奶/纯净	SP0000169			1	12.00	6.00		0	0	0	0	1	1	1	1	f	f
868			180	成品	0	袋	0		450g/25袋	0.00	0.00	0	0	0		1		2026-03-29 06:47:05.316893	2026-03-29 06:47:05.316893	\N	16g青砖袋泡茶	SP0000167			1	18.00	10.24	6974109183959	0	0	0	0	1	1	1	1	f	f
870			180	成品	0	个	0		1.5kg	0.00	0.00	0	0	0		1		2026-03-29 06:47:07.159071	2026-03-29 06:47:07.159071	\N	大青砖茶砖	SP0000165			1	35.00	22.75	6910261376045	0	0	0	0	1	1	1	1	f	f
872			189	半成品	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:47:10.015007	2026-03-29 06:47:10.015007	\N	半成品/黄金纬度牛肉干/那牧尔	SP0000163			2	88.00	41.44	6973457825186	0	0	0	0	1	1	1	1	f	f
873			192	牛肉干	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:47:12.37242	2026-03-29 06:47:12.37242	\N	专袋/牛肉干包装	SP0000162			1	0.00	1.47	6980832219752	0	0	0	0	1	1	1	1	f	f
876			196	定制类产品	0	盒	0		120g	0.00	0.00	0	0	0		1		2026-03-29 06:47:17.101234	2026-03-29 06:47:17.101234	\N	憨野/奶条	SP0000159			1	16.00	4.08		0	0	0	0	1	1	1	1	f	f
878			170	成品	0	盒	0		1一斤装	0.00	0.00	0	0	0		1		2026-03-29 06:47:19.354998	2026-03-29 06:47:19.354998	\N	羊奶粉/1斤	SP0000157			1	18.00	12.50		0	0	0	0	1	1	1	1	f	f
879			167	广告物料	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:20.325013	2026-03-29 06:47:20.325013	\N	干肉奶茶	SP0000156			1	15.00	5.50	6982118636994	0	0	0	0	1	1	1	1	f	f
880			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:21.300867	2026-03-29 06:47:21.300867	\N	阿润月饼/五仁馅	SP0000155			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
881			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:22.211561	2026-03-29 06:47:22.211561	\N	阿润月饼/奶皮子馅	SP0000154			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
882			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:23.133723	2026-03-29 06:47:23.133723	\N	阿润月饼/黄油渣馅	SP0000153			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
883			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:24.030271	2026-03-29 06:47:24.030271	\N	阿润月饼/奶豆腐馅	SP0000152			1	15.00	10.00	6922814823197	0	0	0	0	1	1	1	1	f	f
884			170	成品	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:24.971807	2026-03-29 06:47:24.971807	\N	实惠/奶豆腐	SP0000151			1	20.00	12.00	6900001519215	0	0	0	0	1	1	1	1	f	f
885			172	散装	0	斤	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:25.913003	2026-03-29 06:47:25.913003	\N	冻炒米/散装	SP0000150			1	25.00	16.00	6900001505720	0	0	0	0	1	1	1	1	f	f
886			170	成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:26.803653	2026-03-29 06:47:26.803653	\N	冻炒米/科尔沁	SP0000149			1	12.00	7.00	6900001499679	0	0	0	0	1	1	1	1	f	f
887			170	成品	0	盒	0		320克	0.00	0.00	0	0	0		1		2026-03-29 06:47:27.782543	2026-03-29 06:47:27.782543	\N	羊乳奶粉/奶茶专用	SP0000148			1	32.00	25.00	6900001481464	0	0	0	0	1	1	1	1	f	f
888			170	成品	0	盒	0		320克	0.00	0.00	0	0	0		1		2026-03-29 06:47:29.077221	2026-03-29 06:47:29.077221	\N	河套奶粉	SP0000147			1	18.00	14.00	6900001473306	0	0	0	0	1	1	1	1	f	f
889			170	成品	0	盒	0		1盒	0.00	0.00	0	0	0		1		2026-03-29 06:47:30.038654	2026-03-29 06:47:30.038654	\N	奶皮卷/科尔沁	SP0000146			1	30.00	15.00	6900001463143	0	0	0	0	1	1	1	1	f	f
890			172	散装	0	斤	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:30.97204	2026-03-29 06:47:30.97204	\N	红枣	SP0000145			1	18.00	12.00	6900001459821	0	0	0	0	1	1	1	1	f	f
891			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:32.872859	2026-03-29 06:47:32.872859	\N	芝士奶豆腐月饼	SP0000144			1	8.00	5.00	6900001442932	0	0	0	0	1	1	1	1	f	f
892			198	供货品	0	盒	0		250	0.00	0.00	0	0	0		1		2026-03-29 06:47:34.284505	2026-03-29 06:47:34.284505	\N	那牧尔酸奶	SP0000143			1	8.00	4.00	6900001436777	0	0	0	0	1	1	1	1	f	f
893			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:35.211921	2026-03-29 06:47:35.211921	\N	奶豆腐月饼	SP0000142			1	8.00	5.00	6900001427497	0	0	0	0	1	1	1	1	f	f
894			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:36.135289	2026-03-29 06:47:36.135289	\N	酸奶月饼	SP0000141			1	8.00	5.00	6900001418318	0	0	0	0	1	1	1	1	f	f
895			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:37.070662	2026-03-29 06:47:37.070662	\N	黄油渣月饼	SP0000140			1	8.00	5.00	6900001407174	0	0	0	0	1	1	1	1	f	f
896			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:37.982567	2026-03-29 06:47:37.982567	\N	奶皮月饼	SP0000139			1	8.00	5.00	6900001399224	0	0	0	0	1	1	1	1	f	f
898			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:47:40.504891	2026-03-29 06:47:40.504891	\N	透专标签/奶皮千层	SP0000137			1	0.00	0.07	6900001376529	0	0	0	0	1	1	1	1	f	f
899			170	成品	0	瓶	0		1斤装	0.00	0.00	0	0	0		1		2026-03-29 06:47:41.411767	2026-03-29 06:47:41.411767	\N	纯净/黄油/斤	SP0000136			1	35.00	22.00	6900001367517	0	0	0	0	1	1	1	1	f	f
901			172	散装	0	麻袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:43.221915	2026-03-29 06:47:43.221915	\N	手工白花炒米/散装	SP0000134			1	7.00	5.37	6900001345795	0	0	0	0	1	1	1	1	f	f
903			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:45.154085	2026-03-29 06:47:45.154085	\N	盛宇燃奶豆腐/甜味	SP0000132			1	26.00	19.00	6900001329621	0	0	0	0	1	1	1	1	f	f
906			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:47.908082	2026-03-29 06:47:47.908082	\N	真空奶豆腐砖/原味	SP0000129			1	26.00	17.00	6900001297957	0	0	0	0	1	1	1	1	f	f
908			170	成品	0	袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:49.741949	2026-03-29 06:47:49.741949	\N	哈斯乌拉牛肉干500g原味	SP0000127			1	98.00	83.00	6900001278368	0	0	0	0	1	1	1	1	f	f
910			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:51.965511	2026-03-29 06:47:51.965511	\N	蓝旗绿乳糖奶香酥	SP0000125			1	6.00	4.00	6900001257630	0	0	0	0	1	1	1	1	f	f
912			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:53.899291	2026-03-29 06:47:53.899291	\N	蓝旗绿乳糖水果	SP0000123			1	6.00	4.00	6900001238866	0	0	0	0	1	1	1	1	f	f
915			170	成品	0	盒	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:47:56.98916	2026-03-29 06:47:56.98916	\N	黄油渣/盒	SP0000120			1	12.00	8.00	6900001205597	0	0	0	0	1	1	1	1	f	f
917			172	散装	0	斤	0		斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:58.885589	2026-03-29 06:47:58.885589	\N	机器乌日末液体	SP0000118			1	15.00	9.00	6900001182829	0	0	0	0	1	1	1	1	f	f
919			170	成品	0	瓶	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:48:00.739062	2026-03-29 06:48:00.739062	\N	黄油/斤	SP0000116			1	26.00	20.00	6900001162463	0	0	0	0	1	1	1	1	f	f
921			181	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-29 06:48:02.593872	2026-03-29 06:48:02.593872	\N	嚼口脆炒米糖/散装	SP0000114			1	25.00	15.00	6900001147035	0	0	0	0	1	1	1	1	f	f
923			172	散装	0	斤	0		10斤装/麻袋	0.00	0.00	0	0	0		1		2026-03-29 06:48:04.51461	2026-03-29 06:48:04.51461	\N	炒米/散装/硬口	SP0000112			1	7.50	4.80	6900001127456	0	0	0	0	1	1	1	1	f	f
924			170	成品	0	袋	0		300克	0.00	0.00	0	0	0		1		2026-03-29 06:48:05.452649	2026-03-29 06:48:05.452649	\N	冻炒米/袋装	SP0000111			1	12.00	8.00	6900001115240	0	0	0	0	1	1	1	1	f	f
926			172	散装	0	个	0		1斤2两	0.00	0.00	0	0	0		1		2026-03-29 06:48:07.413569	2026-03-29 06:48:07.413569	\N	大奶豆腐砖/1.2斤	SP0000109			1	35.00	25.00	6900001096391	0	0	0	0	1	1	1	1	f	f
928			178	塑料袋	0	袋	0		大/中/小	0.00	0.00	0	0	0		1		2026-03-29 06:48:09.276363	2026-03-29 06:48:09.276363	\N	塑料购物袋	SP0000107			1	0.00	0.00	6900001075048	0	0	0	0	1	1	1	1	f	f
930			170	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:48:11.17935	2026-03-29 06:48:11.17935	\N	加沙奶豆腐	SP0000105			1	16.00	12.00	6973630778288	0	0	0	0	1	1	1	1	f	f
932			170	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:48:13.155796	2026-03-29 06:48:13.155796	\N	炒米海丰	SP0000103			1	7.50	5.80	6958856810059	0	0	0	0	1	1	1	1	f	f
934			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:15.030001	2026-03-29 06:48:15.030001	\N	透明成品/奶皮千层/线下	SP0000101			1	26.60	0.00	6900001013558	0	0	0	0	1	1	1	1	f	f
936			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:16.97035	2026-03-29 06:48:16.97035	\N	透明成品/奶条/甜味/线下	SP0000099			1	22.00	0.00	6900000999855	0	0	0	0	1	1	1	1	f	f
938			175	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:18.849827	2026-03-29 06:48:18.849827	\N	透明成品/鲜奶酪/甜味/线下	SP0000097			1	29.80	0.00	6977375240277	0	0	0	0	1	1	1	1	f	f
897			198	供货品	0	袋	0		5	0.00	0.00	0	0	0		1		2026-03-29 06:47:39.086674	2026-03-29 06:47:39.086674	\N	早餐包/那牧尔	SP0000138			1	15.00	10.00	6900001382864	0	0	0	0	1	1	1	1	f	f
900			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:47:42.322564	2026-03-29 06:47:42.322564	\N	透专标签/脆香奶条/微甜	SP0000135			1	0.00	0.37	6900001356463	0	0	0	0	1	1	1	1	f	f
902			181	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-29 06:47:44.189326	2026-03-29 06:47:44.189326	\N	乌日莫糖/散装	SP0000133			1	30.00	22.00	6900001338681	0	0	0	0	1	1	1	1	f	f
904			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:46.093461	2026-03-29 06:47:46.093461	\N	盛宇燃奶豆腐/原味	SP0000131			1	26.00	19.00	6900001315573	0	0	0	0	1	1	1	1	f	f
905			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:47.007702	2026-03-29 06:47:47.007702	\N	真空奶豆腐砖/甜味	SP0000130			1	26.00	17.00	6900001305887	0	0	0	0	1	1	1	1	f	f
907			170	成品	0	袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:48.812859	2026-03-29 06:47:48.812859	\N	风干牛肉500g大片	SP0000128			1	128.00	95.00	6900001286630	0	0	0	0	1	1	1	1	f	f
909			181	糖果sugar	0	袋	0		450g	0.00	0.00	0	0	0		1		2026-03-29 06:47:50.676924	2026-03-29 06:47:50.676924	\N	蓝旗绿乳糖惠虹糖	SP0000126			1	9.00	7.00	6900001262639	0	0	0	0	1	1	1	1	f	f
911			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:52.948674	2026-03-29 06:47:52.948674	\N	蓝旗绿乳糖果仁酥	SP0000124			1	6.00	4.00	6900001241338	0	0	0	0	1	1	1	1	f	f
913			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:54.788268	2026-03-29 06:47:54.788268	\N	蓝旗绿乳糖黄油球	SP0000122			1	6.00	4.00	6900001223574	0	0	0	0	1	1	1	1	f	f
914			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:55.689564	2026-03-29 06:47:55.689564	\N	蓝旗绿乳糖炼乳	SP0000121			1	6.00	4.00	6900001214103	0	0	0	0	1	1	1	1	f	f
916			172	散装	0	盒	0		半斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:57.888413	2026-03-29 06:47:57.888413	\N	脆奶条/散装/科尔沁	SP0000119			1	12.50	7.00	6900001196244	0	0	0	0	1	1	1	1	f	f
918			170	成品	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-29 06:47:59.814553	2026-03-29 06:47:59.814553	\N	黄油/半斤	SP0000117			1	16.00	11.00	6900001176074	0	0	0	0	1	1	1	1	f	f
920			172	散装	0	斤	0		斤	0.00	0.00	0	0	0		1		2026-03-29 06:48:01.691012	2026-03-29 06:48:01.691012	\N	手工乌日末液体	SP0000115			1	10.00	8.00	6900001151503	0	0	0	0	1	1	1	1	f	f
922			181	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-29 06:48:03.552073	2026-03-29 06:48:03.552073	\N	酸奶炒米糖/散装	SP0000113			1	20.00	10.00	6900001139227	0	0	0	0	1	1	1	1	f	f
925			172	散装	0	个	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:48:06.43905	2026-03-29 06:48:06.43905	\N	小/无印花/奶豆腐砖/1斤	SP0000110			1	32.00	20.00	6900001102849	0	0	0	0	1	1	1	1	f	f
927			172	散装	0	个	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:48:08.309904	2026-03-29 06:48:08.309904	\N	小奶豆腐砖/1斤	SP0000108			1	30.00	20.00	6900001086128	0	0	0	0	1	1	1	1	f	f
929			170	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:48:10.195771	2026-03-29 06:48:10.195771	\N	白砂糖	SP0000106			1	5.00	3.50	6900001064304	0	0	0	0	1	1	1	1	f	f
931			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:48:12.214368	2026-03-29 06:48:12.214368	\N	炒米粉/aag	SP0000104			1	6.50	4.80	6900001043080	0	0	0	0	1	1	1	1	f	f
933			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:14.106114	2026-03-29 06:48:14.106114	\N	透明成品/奶条/原味/线下	SP0000102			1	22.00	0.00	6900001026070	0	0	0	0	1	1	1	1	f	f
935			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:16.074131	2026-03-29 06:48:16.074131	\N	透明成品/奶皮卷/线下	SP0000100			1	26.60	0.00	6900001005826	0	0	0	0	1	1	1	1	f	f
937			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:17.935558	2026-03-29 06:48:17.935558	\N	透明成品/鲜奶皮/线下	SP0000098			1	29.80	0.00	6900000986032	0	0	0	0	1	1	1	1	f	f
939			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:20.581591	2026-03-29 06:48:20.581591	\N	半成品/透明/原味/鲜奶酪	SP0000096			2	29.80	13.00	6900000966050	0	0	0	0	1	1	1	1	f	f
940			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:21.541764	2026-03-29 06:48:21.541764	\N	半成品/透明/甜味/鲜奶酪	SP0000095			2	29.80	13.00	6900000955561	0	0	0	0	1	1	1	1	f	f
941			175	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:22.463963	2026-03-29 06:48:22.463963	\N	透明成品/鲜奶酪/原味/线下	SP0000094			1	29.80	0.00	6900000947515	0	0	0	0	1	1	1	1	f	f
942			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:23.394765	2026-03-29 06:48:23.394765	\N	半成品/透明/甜味奶条	SP0000093			2	22.00	6.80	6900000935538	0	0	0	0	1	1	1	1	f	f
943			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:24.289833	2026-03-29 06:48:24.289833	\N	半成品/透明/原味奶条	SP0000092			2	22.00	7.20	6900000924342	0	0	0	0	1	1	1	1	f	f
944			200	给组装好产品	0	盒	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:48:25.20265	2026-03-29 06:48:25.20265	\N	半成品/透明/奶皮千层	SP0000091			2	25.60	12.00	6900000917840	0	0	0	0	1	1	1	1	f	f
945			200	给组装好产品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:26.204461	2026-03-29 06:48:26.204461	\N	半成品/透明/奶皮卷	SP0000090			2	26.60	13.00	6900000907890	0	0	0	0	1	1	1	1	f	f
946			200	给组装好产品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:27.116959	2026-03-29 06:48:27.116959	\N	半成品/透明/鲜奶皮	SP0000089			2	26.60	14.00	6900000899530	0	0	0	0	1	1	1	1	f	f
947			167	广告物料	0	张	0		价格/规格/不定	0.00	0.00	0	0	0		1		2026-03-29 06:48:27.999927	2026-03-29 06:48:27.999927	\N	展示用卡牌	SP0000088			1	0.00	0.00	6900000881797	0	0	0	0	1	1	1	1	f	f
948			184	袋子	0	张	0		250克装	0.00	0.00	0	0	0		1		2026-03-29 06:48:28.905411	2026-03-29 06:48:28.905411	\N	专袋/乌日莫	SP0000087			1	0.00	0.46	6900000874528	0	0	0	0	1	1	1	1	f	f
949			184	袋子	0	张	0		500克装	0.00	0.00	0	0	0		1		2026-03-29 06:48:29.858794	2026-03-29 06:48:29.858794	\N	专袋/乌日莫/炒米	SP0000086			1	0.00	0.79	6900000861218	0	0	0	0	1	1	1	1	f	f
950			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:30.827947	2026-03-29 06:48:30.827947	\N	透专标签/奶皮卷	SP0000085			1	0.00	0.37	6900000856863	0	0	0	0	1	1	1	1	f	f
951			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:32.155746	2026-03-29 06:48:32.155746	\N	透专标签/冻炒米	SP0000084			1	0.00	0.37	6900000847671	0	0	0	0	1	1	1	1	f	f
952			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:33.061995	2026-03-29 06:48:33.061995	\N	透专标签/奶酪/原味	SP0000083			1	0.00	0.37	6900000831130	0	0	0	0	1	1	1	1	f	f
954			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:34.870605	2026-03-29 06:48:34.870605	\N	透专标签/乳清奶条/甜味	SP0000081			1	0.00	0.05	6900000815004	0	0	0	0	1	1	1	1	f	f
956			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:36.709091	2026-03-29 06:48:36.709091	\N	透专标签/鲜奶皮	SP0000079			1	0.00	0.37	6900000794933	0	0	0	0	1	1	1	1	f	f
957			201	亚克力	0	盒	0		待包换/冻炒米 145X85X55	0.00	0.00	0	0	0		1		2026-03-29 06:48:38.085612	2026-03-29 06:48:38.085612	\N	大/长方/亚克力/待用	SP0000078			1	0.00	1.30	6900000782027	0	0	0	0	1	1	1	1	f	f
959			201	亚克力	0	盒	0		235X170X35	0.00	0.00	0	0	0		1		2026-03-29 06:48:40.035059	2026-03-29 06:48:40.035059	\N	大/牛薄脆盒/亚克力	SP0000076			1	0.00	2.60	6900000761425	0	0	0	0	1	1	1	1	f	f
961			201	亚克力	0	盒	0		182X120X28/烤奶豆腐片/奶皮卷	0.00	0.00	0	0	0		1		2026-03-29 06:48:41.925836	2026-03-29 06:48:41.925836	\N	扁盒/亚克力/带内托	SP0000074			1	0.00	1.75	6900000747152	0	0	0	0	1	1	1	1	f	f
962			201	亚克力	0	盒	0		85X85X63  鲜奶皮	0.00	0.00	0	0	0		1		2026-03-29 06:48:42.8266	2026-03-29 06:48:42.8266	\N	中/方形/亚克力盒/	SP0000072			1	2.50	0.85	6900000724486	0	0	0	0	1	1	1	1	f	f
964			175	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:44.692601	2026-03-29 06:48:44.692601	\N	透明成品/冻炒米/线下	SP0000070			1	23.50	0.00	6900000709295	0	0	0	0	1	1	1	1	f	f
966			202	散小包装	0	小包	0		50克	0.00	0.00	0	0	0		1		2026-03-29 06:48:47.671566	2026-03-29 06:48:47.671566	\N	查嘎粉/小包装袋	SP0000068			1	5.00	3.00	6900000686492	0	0	0	0	1	1	1	1	f	f
968			172	散装	0	张	0		150-180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:49.50128	2026-03-29 06:48:49.50128	\N	大/奶皮	SP0000066			1	20.00	13.00	6900000661992	0	0	0	0	1	1	1	1	f	f
970			170	成品	0	盒	0		200克	0.00	0.00	0	0	0	供货价13	1		2026-03-29 06:48:51.325392	2026-03-29 06:48:51.325392	\N	热奶豆腐碗	SP0000064			1	15.00	10.00	6900000642521	0	0	0	0	1	1	1	1	f	f
972			172	散装	0	斤	0		45散称/斤/9元/100克	0.00	0.00	0	0	0		1		2026-03-29 06:48:53.114651	2026-03-29 06:48:53.114651	\N	原味/散称/奶豆腐块儿	SP0000062			1	70.00	45.00	6900000623124	0	0	0	0	1	1	1	1	f	f
974			203	组装好品	0	瓶	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:55.46244	2026-03-29 06:48:55.46244	\N	纯净黄油/瓶装好的	SP0000060			1	0.00	6.00	6900000604359	0	0	0	0	1	1	1	1	f	f
978			205	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:00.454145	2026-03-29 06:49:00.454145	\N	新茶专用标签纸	SP0000056			1	0.00	0.05	6900000561600	0	0	0	0	1	1	1	1	f	f
980			193	成品	0	盒	0		16次泡	0.00	0.00	0	0	0		1		2026-03-29 06:49:02.270151	2026-03-29 06:49:02.270151	\N	新/青砖奶茶	SP0000054			1	58.00	0.00	6977252570039	0	0	0	0	1	1	1	1	f	f
982			178	塑料袋	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:04.122927	2026-03-29 06:49:04.122927	\N	塑料手提袋	SP0000052			1	0.00	0.19	6900000526367	0	0	0	0	1	1	1	1	f	f
984			205	青砖奶茶	0	张	0		一张	0.00	0.00	0	0	0		1		2026-03-29 06:49:07.274393	2026-03-29 06:49:07.274393	\N	茶包/类腰封纸	SP0000050			1	0.00	0.18	6900000504012	0	0	0	0	1	1	1	1	f	f
986			189	半成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:49:09.108042	2026-03-29 06:49:09.108042	\N	精品/奶豆腐块儿/原味	SP0000048			1	20.00	14.50	6900000481263	0	0	0	0	1	1	1	1	f	f
988			193	成品	0	袋	0		150	0.00	0.00	0	0	0		1		2026-03-29 06:49:11.402339	2026-03-29 06:49:11.402339	\N	原味传统奶豆腐/成品袋装	SP0000046			1	34.00	12.78	6900000461987	0	0	0	0	1	1	1	1	f	f
990			210	奶果子	0	袋	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:14.199822	2026-03-29 06:49:14.199822	\N	奶果子/专用塑膜袋	SP0000044			1	0.00	0.10	6900000443474	0	0	0	0	1	1	1	1	f	f
994			193	成品	0	盒	0		110克	0.00	0.00	0	0	0		1		2026-03-29 06:49:19.767881	2026-03-29 06:49:19.767881	\N	冻炒米成品盒	SP0000040			1	36.00	6.00	6900000408112	0	0	0	0	1	1	1	1	f	f
996			193	成品	0	盒	0		16次泡	0.00	0.00	0	0	0		1		2026-03-29 06:49:21.709118	2026-03-29 06:49:21.709118	\N	青砖奶茶成品	SP0000038			1	58.00	15.00	6900000389670	0	0	0	0	1	1	1	1	f	f
999			205	青砖奶茶	0	张	0		0	0.00	0.00	0	0	0		1		2026-03-29 06:49:24.473332	2026-03-29 06:49:24.473332	\N	茶专用/不干胶/标签	SP0000035			1	0.00	0.04	6900000358921	0	0	0	0	1	1	1	1	f	f
1002			214	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:28.558493	2026-03-29 06:49:28.558493	\N	封口机/真空	SP0000032			1	0.00	3800.00	6900000324528	0	0	0	0	1	1	1	1	f	f
1004			204	其他成本	0	件	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:30.397892	2026-03-29 06:49:30.397892	\N	圆通速递快递费	SP0000030			1	0.00	4.00	6900000308856	0	0	0	0	1	1	1	1	f	f
1006			204	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:32.29213	2026-03-29 06:49:32.29213	\N	顺丰快递费	SP0000028			1	0.00	0.00	6900000286232	0	0	0	0	1	1	1	1	f	f
1008			193	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:49:34.136449	2026-03-29 06:49:34.136449	\N	甜味奶条成品	SP0000026			1	52.00	10.61	6900000265125	0	0	0	0	1	1	1	1	f	f
1010			189	半成品	0	个	0		400/箱/0.423/球	0.00	0.00	0	0	0		1		2026-03-29 06:49:36.02884	2026-03-29 06:49:36.02884	\N	奶油球	SP0000024			1	0.00	0.45	6900000243728	0	0	0	0	1	1	1	1	f	f
1012			204	其他成本	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:37.853679	2026-03-29 06:49:37.853679	\N	北方人工费	SP0000022			1	0.00	1.30	6900000221261	0	0	0	0	1	1	1	1	f	f
1014			189	半成品	0	袋	0		250克/一袋	0.00	0.00	0	0	0		1		2026-03-29 06:49:39.760183	2026-03-29 06:49:39.760183	\N	散装/甜味奶条	SP0000020			1	15.00	8.50	6962547070553	0	0	0	0	1	1	1	1	f	f
1016			187	黄油	0	瓶	0		100ML	0.00	0.00	0	0	0		1		2026-03-29 06:49:41.599301	2026-03-29 06:49:41.599301	\N	专瓶/黄油	SP0000018			1	0.00	1.80	6900000186971	0	0	0	0	1	1	1	1	f	f
1017			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:42.517342	2026-03-29 06:49:42.517342	\N	手提袋	SP0000017			1	0.00	0.94	6900000178722	0	0	0	0	1	1	1	1	f	f
1019			212	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:44.564594	2026-03-29 06:49:44.564594	\N	标签/不干胶/冻炒米	SP0000015			1	0.00	0.07	6900000151480	0	0	0	0	1	1	1	1	f	f
1020			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:45.516509	2026-03-29 06:49:45.516509	\N	标签/不干胶/奶果子	SP0000014			1	0.00	0.03	6900000148085	0	0	0	0	1	1	1	1	f	f
1022			207	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:47.397246	2026-03-29 06:49:47.397246	\N	专袋/传统奶豆腐	SP0000012			1	0.00	0.55	6900000127767	0	0	0	0	1	1	1	1	f	f
953			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:33.971244	2026-03-29 06:48:33.971244	\N	透专标签/奶酪/甜味	SP0000082			1	0.00	0.37	6900000828304	0	0	0	0	1	1	1	1	f	f
955			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:35.780754	2026-03-29 06:48:35.780754	\N	透专标签/乳清奶条/原味	SP0000080			1	0.00	0.05	6900000807613	0	0	0	0	1	1	1	1	f	f
958			201	亚克力	0	盒	0		乳清奶条盒	0.00	0.00	0	0	0		1		2026-03-29 06:48:39.011957	2026-03-29 06:48:39.011957	\N	小/长方/亚克力/乳清奶条盒	SP0000077			1	0.00	1.20	6900000778282	0	0	0	0	1	1	1	1	f	f
960			201	亚克力	0	盒	0		31g	0.00	0.00	0	0	0		1		2026-03-29 06:48:40.941275	2026-03-29 06:48:40.941275	\N	三角/奶皮千层盒	SP0000075			1	0.00	0.85	6900000754498	0	0	0	0	1	1	1	1	f	f
963			201	亚克力	0	盒	0		7.4X7.4X7.8 奶豆腐/冻炒米通用	0.00	0.00	0	0	0		1		2026-03-29 06:48:43.763191	2026-03-29 06:48:43.763191	\N	小/方形/亚克力盒/	SP0000071			1	2.00	0.80	6900000719676	0	0	0	0	1	1	1	1	f	f
965			200	给组装好产品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:45.594305	2026-03-29 06:48:45.594305	\N	半成品/透明/冻炒米	SP0000069			2	23.50	4.20	6900000699220	0	0	0	0	1	1	1	1	f	f
967			168	散货	0	桶	0		4斤装	0.00	0.00	0	0	0	4斤装/1元一斤	1		2026-03-29 06:48:48.573276	2026-03-29 06:48:48.573276	\N	查嘎/乳清	SP0000067			1	10.00	4.00	6900000679211	0	0	0	0	1	1	1	1	f	f
969			172	散装	0	张	0		120-150克	0.00	0.00	0	0	0		1		2026-03-29 06:48:50.432711	2026-03-29 06:48:50.432711	\N	小/奶皮	SP0000065			1	15.00	10.00	6900000651693	0	0	0	0	1	1	1	1	f	f
971			172	散装	0	斤	0		45散称/斤/9元/100克	0.00	0.00	0	0	0		1		2026-03-29 06:48:52.219121	2026-03-29 06:48:52.219121	\N	甜味/散称/奶豆腐块儿	SP0000063			1	70.00	45.00	6900000639276	0	0	0	0	1	1	1	1	f	f
973			189	半成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:48:54.105148	2026-03-29 06:48:54.105148	\N	精品/奶豆腐块儿/甜味/	SP0000061			1	20.00	14.50	6900000617311	0	0	0	0	1	1	1	1	f	f
975			187	黄油	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:56.402437	2026-03-29 06:48:56.402437	\N	黄油脖签	SP0000059			1	0.00	0.08	6900000598069	0	0	0	0	1	1	1	1	f	f
976			193	成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:57.349972	2026-03-29 06:48:57.349972	\N	暂用/茶 新旧更替	SP0000058			1	58.00	0.00	6900000589769	0	0	0	0	1	1	1	1	f	f
977			204	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:59.050296	2026-03-29 06:48:59.050296	\N	新茶包人工费	SP0000057			1	0.00	1.00	6900000571565	0	0	0	0	1	1	1	1	f	f
979			205	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:01.363799	2026-03-29 06:49:01.363799	\N	新茶包/纸	SP0000055			1	0.00	0.27	6900000553413	0	0	0	0	1	1	1	1	f	f
981			172	散装	0	盒	0		斤/两盒	0.00	0.00	0	0	0		1		2026-03-29 06:49:03.200495	2026-03-29 06:49:03.200495	\N	烤奶皮	SP0000053			1	30.00	22.00	6900000535282	0	0	0	0	1	1	1	1	f	f
983			207	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:06.374033	2026-03-29 06:49:06.374033	\N	甜味/标签/不干胶/传统奶豆腐	SP0000051			1	0.00	0.06	6900000517653	0	0	0	0	1	1	1	1	f	f
985			193	成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:49:08.209757	2026-03-29 06:49:08.209757	\N	甜味传统奶豆腐/袋装成品	SP0000049			1	34.00	12.78	6900000499096	0	0	0	0	1	1	1	1	f	f
987			208	样品采购	0	斤	0		不定具体产品	0.00	0.00	0	0	0		1		2026-03-29 06:49:10.488839	2026-03-29 06:49:10.488839	\N	采购样品专用/乳制品	SP0000047			1	0.00	0.00	6900000479748	0	0	0	0	1	1	1	1	f	f
989			193	成品	0	瓶	0		100克	0.00	0.00	0	0	0		1		2026-03-29 06:49:12.346781	2026-03-29 06:49:12.346781	\N	蒙古黄油/瓶装成品	SP0000045			1	39.00	8.05	6900000452315	0	0	0	0	1	1	1	1	f	f
991			189	半成品	0	块儿	0		平均一块儿	0.00	0.00	0	0	0		1		2026-03-29 06:49:15.192546	2026-03-29 06:49:15.192546	\N	奶果子/散装	SP0000043			1	2.50	0.80	6900000434411	0	0	0	0	1	1	1	1	f	f
992			193	成品	0	盒	0		240克	0.00	0.00	0	0	0		1		2026-03-29 06:49:16.624293	2026-03-29 06:49:16.624293	\N	奶果子/盒装/成品	SP0000042			1	58.00	13.21	6900000427543	0	0	0	0	1	1	1	1	f	f
993			212	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:18.84322	2026-03-29 06:49:18.84322	\N	冻炒米专用/塑膜袋	SP0000041			1	0.00	0.10	6900000413063	0	0	0	0	1	1	1	1	f	f
995			205	青砖奶茶	0	袋	0		0	0.00	0.00	0	0	0		1		2026-03-29 06:49:20.768185	2026-03-29 06:49:20.768185	\N	茶专用/热缩膜	SP0000039			1	0.00	0.10	6900000393419	0	0	0	0	1	1	1	1	f	f
997			189	半成品	0	小包	0		2g	0.00	0.00	0	0	0		1		2026-03-29 06:49:22.630194	2026-03-29 06:49:22.630194	\N	茶专用/盐包	SP0000037			1	0.00	0.07	6900000375562	0	0	0	0	1	1	1	1	f	f
998			205	青砖奶茶	0	张	0		0	0.00	0.00	0	0	0		1		2026-03-29 06:49:23.558588	2026-03-29 06:49:23.558588	\N	茶专用/硫酸纸	SP0000036			1	0.00	0.32	6900000362581	0	0	0	0	1	1	1	1	f	f
1000			205	青砖奶茶	0	个	0		袋100个/平均价0.1599	0.00	0.00	0	0	0		1		2026-03-29 06:49:25.419757	2026-03-29 06:49:25.419757	\N	木勺	SP0000034			1	0.00	0.16	6900000349016	0	0	0	0	1	1	1	1	f	f
1001			214	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:27.293725	2026-03-29 06:49:27.293725	\N	冷冻柜/冰箱	SP0000033			1	0.00	1609.48	6900000335117	0	0	0	0	1	1	1	1	f	f
1003			214	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:29.482236	2026-03-29 06:49:29.482236	\N	热收缩膜机	SP0000031			1	0.00	1838.00	6900000316828	0	0	0	0	1	1	1	1	f	f
1005			204	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:31.377292	2026-03-29 06:49:31.377292	\N	泰成物流费	SP0000029			1	0.00	0.00	6900000291007	0	0	0	0	1	1	1	1	f	f
1007			193	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:49:33.228395	2026-03-29 06:49:33.228395	\N	原味奶条成品	SP0000027			1	52.00	11.61	6900000277492	0	0	0	0	1	1	1	1	f	f
1009			205	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:35.084281	2026-03-29 06:49:35.084281	\N	专盒/青砖奶茶外盒	SP0000025			1	0.00	2.50	6900000256884	0	0	0	0	1	1	1	1	f	f
1011			189	半成品	0	小包	0		1件2000包/300元/1件	0.00	0.00	0	0	0	已加运费平均采购价	1		2026-03-29 06:49:36.942129	2026-03-29 06:49:36.942129	\N	茶包	SP0000023			1	0.00	0.18	6900000233034	0	0	0	0	1	1	1	1	f	f
1013			189	半成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:38.797883	2026-03-29 06:49:38.797883	\N	冻炒米/给组装半成品/那牧尔	SP0000021			2	0.00	5.50	6900000218137	0	0	0	0	1	1	1	1	f	f
1015			189	半成品	0	袋	0		250克/一袋	0.00	0.00	0	0	0		1		2026-03-29 06:49:40.677313	2026-03-29 06:49:40.677313	\N	散装/原味奶条	SP0000019			1	0.00	9.00	6915451232840	0	0	0	0	1	1	1	1	f	f
1018			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:43.444451	2026-03-29 06:49:43.444451	\N	礼盒/蓝界	SP0000016			1	8.00	4.55	6900000169010	0	0	0	0	1	1	1	1	f	f
1021			207	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:46.451412	2026-03-29 06:49:46.451412	\N	原味/标签/不干胶/传统奶豆腐	SP0000013			1	0.00	0.06	6900000132020	0	0	0	0	1	1	1	1	f	f
1023			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:48.83623	2026-03-29 06:49:48.83623	\N	标签/不干胶/奶条/原味	SP0000011			1	0.00	0.05	6900000115061	0	0	0	0	1	1	1	1	f	f
1025			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:50.732689	2026-03-29 06:49:50.732689	\N	定制款/专内袋/扎那家奶果子	SP0000009			1	0.00	0.07	6900000097364	0	0	0	0	1	1	1	1	f	f
1027			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:52.573581	2026-03-29 06:49:52.573581	\N	真空袋	SP0000007			1	0.00	0.17	6900000079283	0	0	0	0	1	1	1	1	f	f
1029			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:54.408934	2026-03-29 06:49:54.408934	\N	专内盒/奶果子	SP0000005			1	0.00	0.65	6900000053298	0	0	0	0	1	1	1	1	f	f
1031			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:56.37743	2026-03-29 06:49:56.37743	\N	专底盒/奶条	SP0000003			1	0.00	0.37	6900000032892	0	0	0	0	1	1	1	1	f	f
1033			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:58.382336	2026-03-29 06:49:58.382336	\N	专袋/奶条	SP0000001			1	0.00	0.71	6900000015365	0	0	0	0	1	1	1	1	f	f
1024			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:49.772554	2026-03-29 06:49:49.772554	\N	标签/不干胶/奶条/甜味	SP0000010			1	0.00	0.05	6900000108033	0	0	0	0	1	1	1	1	f	f
1026			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:51.651482	2026-03-29 06:49:51.651482	\N	专内袋/奶果子	SP0000008			1	0.00	0.08	6900000085792	0	0	0	0	1	1	1	1	f	f
1028			187	黄油	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:53.495723	2026-03-29 06:49:53.495723	\N	专标签/黄油	SP0000006			1	0.00	0.06	6900000068809	0	0	0	0	1	1	1	1	f	f
1030			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:55.371296	2026-03-29 06:49:55.371296	\N	专外盒/奶果子	SP0000004			1	0.00	0.65	6900000045203	0	0	0	0	1	1	1	1	f	f
1032			212	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:57.401382	2026-03-29 06:49:57.401382	\N	专盒/冻炒米	SP0000002			1	0.00	0.87	6900000028430	0	0	0	0	1	1	1	1	f	f
\.


--
-- Data for Name: goods_brand; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_brand (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_cate; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_cate (id, name, parent_id, sort, status, create_time) FROM stdin;
167	广告物料	0	0	1	2026-03-29 06:45:49.536786
168	散货	0	0	1	2026-03-29 06:45:53.755009
169	散货	168	0	1	2026-03-29 06:45:54.188484
170	成品	169	0	1	2026-03-29 06:45:54.671183
171	酒	170	0	1	2026-03-29 06:46:06.346515
172	散装	168	0	1	2026-03-29 06:46:12.348459
173	品牌	168	0	1	2026-03-29 06:46:16.151502
174	透明	173	0	1	2026-03-29 06:46:16.633794
175	成品	174	0	1	2026-03-29 06:46:17.077612
176	通用礼盒	0	0	1	2026-03-29 06:46:26.217205
177	手提袋	176	0	1	2026-03-29 06:46:28.57814
178	塑料袋	177	0	1	2026-03-29 06:46:29.037589
179	茶类	170	0	1	2026-03-29 06:46:31.499258
180	成品	179	0	1	2026-03-29 06:46:31.978033
181	糖果sugar	170	0	1	2026-03-29 06:46:42.124939
182	专包	168	0	1	2026-03-29 06:46:44.418914
183	材	182	0	1	2026-03-29 06:46:44.895763
184	袋子	183	0	1	2026-03-29 06:46:45.338646
185	包材	0	0	1	2026-03-29 06:46:56.913169
186	专包材	185	0	1	2026-03-29 06:46:57.425495
187	黄油	186	0	1	2026-03-29 06:46:58.008847
189	半成品	188	0	1	2026-03-29 06:47:09.026076
190	高端品包材	188	0	1	2026-03-29 06:47:10.489275
191	专包	190	0	1	2026-03-29 06:47:10.975798
192	牛肉干	191	0	1	2026-03-29 06:47:11.414313
193	成品	188	0	1	2026-03-29 06:47:12.963785
194	客户	175	0	1	2026-03-29 06:47:14.375084
195	专属	194	0	1	2026-03-29 06:47:14.807194
196	定制类产品	195	0	1	2026-03-29 06:47:15.280012
197	那牧尔	170	0	1	2026-03-29 06:47:31.409256
198	供货品	197	0	1	2026-03-29 06:47:31.894537
199	标签纸	183	0	1	2026-03-29 06:47:39.545804
200	给组装好产品	168	0	1	2026-03-29 06:48:19.298514
201	亚克力	183	0	1	2026-03-29 06:48:37.175267
202	散小包装	168	0	1	2026-03-29 06:48:46.054218
203	组装好品	188	0	1	2026-03-29 06:48:54.545469
204	其他成本	0	0	1	2026-03-29 06:48:57.790078
205	青砖奶茶	186	0	1	2026-03-29 06:48:59.555321
206	专袋	185	0	1	2026-03-29 06:49:04.562385
207	传统奶豆腐	206	0	1	2026-03-29 06:49:05.03863
208	样品采购	0	0	1	2026-03-29 06:49:09.573978
209	专盒	185	0	1	2026-03-29 06:49:12.790309
210	奶果子	209	0	1	2026-03-29 06:49:13.284988
211	包材	185	0	1	2026-03-29 06:49:17.093791
212	冻炒米	211	0	1	2026-03-29 06:49:17.543121
213	机器	0	0	1	2026-03-29 06:49:25.88655
214	设备	213	0	1	2026-03-29 06:49:26.381084
215	奶条	211	0	1	2026-03-29 06:49:47.902666
188	牧区纯坊X游牧奇遇	0	1	1	2026-03-29 06:47:08.592627
\.


--
-- Data for Name: goods_spec; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_spec (id, name, "values", status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_unit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_unit (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.jobs (id, name, dept_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: operation_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.operation_logs (id, admin_id, admin_name, action, ip, created_at) FROM stdin;
\.


--
-- Data for Name: pay_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pay_receipt (id, receipt_no, order_sn, contact_type, contact_name, amount, pay_date, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
50	FK202603299243		other	一个安全灯，两个灭火器	205.00	2026-02-10	5	道力干记录付款单	一个安全灯，两个灭火器	1	2026-03-29 15:37:29.949765	\N
51	FK202603293286		other	包装支出	4300.00	2026-02-01	7	公司支出账户	乌海文旅集团包装印刷费用	1	2026-03-29 15:37:31.828773	\N
52	FK202603296295		other	购物袋/小/中/大/奶皮真空袋/各100张	54.00	2026-02-01	7	公司支出账户	购物袋/小/中/大/奶皮真空袋/各100张	1	2026-03-29 15:37:32.734334	\N
53	FK202603298127		other	民族印刷厂	16.00	2026-01-08	7	公司支出账户	乌海文旅集团集团打印	1	2026-03-29 15:37:33.677508	\N
54	FK202603293993		other	路费/收费站	43.00	2026-01-08	7	公司支出账户	乌海文旅集团/合同文件/ 打样礼盒	1	2026-03-29 15:37:34.609582	\N
55	FK202603294726		other	店面	360.00	2026-01-05	7	公司支出账户	店面	1	2026-03-29 15:37:35.616719	\N
56	FK202603296408		other	劳务费	719.00	2026-01-05	7	公司支出账户	劳务费	1	2026-03-29 15:37:36.519705	\N
57	FK202603295513		other	店面	405.00	2025-12-28	8	孟根	编织筐。10个250元\n地毯。155元	1	2026-03-29 15:37:38.346429	\N
58	FK202603299673		other	店面	145.00	2025-12-28	8	孟根	地毯36➕麻绳20=56元\n试营业字打印4元\n发财树80元\n推拉贴 5元	1	2026-03-29 15:37:39.350547	\N
59	FK202603294846		other	店面	3500.00	2025-12-28	8	孟根	店面	1	2026-03-29 15:37:40.345208	\N
60	FK202603299527		other	那牧尔乳制品厂/纯净之源	20.00	2025-12-16	7	公司支出账户	拉货	1	2026-03-29 15:37:41.252526	\N
61	FK202603295590		other	那牧尔乳制品厂/纯净之源	487.60	2025-12-05	7	公司支出账户	奶果子内袋包装费/42.92公斤/1公斤11.36元。	1	2026-03-29 15:37:42.148896	\N
62	FK202603296675		other	店面	150.00	2025-12-04	7	公司支出账户	店面	1	2026-03-29 15:37:43.177797	\N
63	FK202603295685		other	店面	600.00	2025-12-04	7	公司支出账户	店面	1	2026-03-29 15:37:44.150817	\N
64	FK202603293583		other	拼多多/随机店采购	38.90	2025-12-04	7	公司支出账户	计算器	1	2026-03-29 15:37:45.062344	\N
65	FK202603293606		other	店面	400.00	2025-12-04	7	公司支出账户	要了分断式的	1	2026-03-29 15:37:45.972017	\N
66	FK202603294619		other	店面	180.00	2025-12-04	7	公司支出账户	三个货架+地板贴	1	2026-03-29 15:37:46.873213	\N
67	FK202603294511		other	包装支出	400.00	2025-12-04	7	公司支出账户	打样费两次，定制打货5000以上会扣除。	1	2026-03-29 15:37:47.925845	\N
68	FK202603293178		other	店面	31.30	2025-11-26	7	公司支出账户	店面	1	2026-03-29 15:37:48.900549	\N
69	FK202603295676		other	店面	2800.00	2025-11-22	8	孟根	店面	1	2026-03-29 15:37:49.906692	\N
70	FK202603293376		other	店面	113.00	2025-11-21	7	公司支出账户	店面	1	2026-03-29 15:37:50.855229	\N
71	FK202603298255		other	店面	4000.00	2025-11-20	8	孟根	两个2米6	1	2026-03-29 15:37:51.782917	\N
72	FK202603299758		other	店面	20.38	2025-11-20	7	公司支出账户	店面	1	2026-03-29 15:37:52.682326	\N
73	FK202603292372		other	店面	1574.00	2025-11-17	8	孟根	店面	1	2026-03-29 15:37:53.622949	\N
74	FK202603292865		other	店面	2800.45	2025-11-14	8	孟根	店面	1	2026-03-29 15:37:54.884444	\N
75	FK202603295589		other	店面	65.20	2025-11-16	7	公司支出账户	店面	1	2026-03-29 15:37:55.770361	\N
76	FK202603296838		other	店面	300.00	2025-11-16	7	公司支出账户	店面	1	2026-03-29 15:37:56.664712	\N
77	FK202603293766		other	店面	1000.00	2025-11-16	7	公司支出账户	总额5000	1	2026-03-29 15:37:57.622223	\N
78	FK202603297328		other	店面	1410.00	2025-11-16	7	公司支出账户	卫生间隔断60+安装三相电闸180+安装灯/插排/230/水龙头/90+地板贴安装/卫生850	1	2026-03-29 15:37:58.872661	\N
79	FK202603292919		other	店面	399.00	2025-11-07	7	公司支出账户	已开票/三相电线	1	2026-03-29 15:37:59.793984	\N
80	FK202603296019		other	店面	300.00	2025-11-16	7	公司支出账户	店面	1	2026-03-29 15:38:00.775247	\N
81	FK202603292739		other	店面	1600.00	2025-11-16	7	公司支出账户	张静海/水暖/大白/隔断	1	2026-03-29 15:38:01.690294	\N
82	FK202603299527		other	店面	5000.00	2025-11-11	8	孟根	张静海/水暖/大白/隔断/部分尾款	1	2026-03-29 15:38:02.57709	\N
83	FK202603296344		other	其他支出	796.00	2025-11-01	9	乌日力格	其他支出	1	2026-03-29 15:38:04.41024	\N
84	FK202603292934		other	店面	518.80	2025-11-01	8	孟根	店面	1	2026-03-29 15:38:05.340346	\N
85	FK202603296825		other	店面	3400.00	2025-11-01	8	孟根	共计6400/已结清	1	2026-03-29 15:38:06.289758	\N
86	FK202603297905		other	店面	700.00	2025-11-01	8	孟根	店面	1	2026-03-29 15:38:07.179161	\N
87	FK202603291825		other	其他支出	1500.00	2025-11-01	9	乌日力格	共计2500， 还欠1000元	1	2026-03-29 15:38:08.105727	\N
88	FK202603291967		other	店面	25.00	2025-10-28	9	乌日力格	钉子/发泡剂	1	2026-03-29 15:38:09.015514	\N
89	FK202603295096		other	店面	5000.00	2025-10-26	9	乌日力格	总金额/预付款	1	2026-03-29 15:38:10.05528	\N
90	FK202603292233		other	店面	350.00	2025-10-24	9	乌日力格	店面	1	2026-03-29 15:38:10.96623	\N
91	FK202603291623		other	店面	540.00	2025-10-26	9	乌日力格	店面	1	2026-03-29 15:38:11.858102	\N
92	FK202603294894		other	其他支出	800.00	2025-10-23	10	乌日力格/额外支出	其他支出	1	2026-03-29 15:38:14.074908	\N
93	FK202603292505		other	其他支出	660.00	2025-10-26	10	乌日力格/额外支出	其他支出	1	2026-03-29 15:38:14.980808	\N
94	FK202603294981		other	其他支出	10000.00	2025-10-26	10	乌日力格/额外支出	其他支出	1	2026-03-29 15:38:15.91545	\N
95	FK202603294962		other	店面	286.00	2025-10-14	8	孟根	店面	1	2026-03-29 15:38:16.81842	\N
96	FK202603295262		other	店面	3000.00	2025-10-13	8	孟根	店面	1	2026-03-29 15:38:17.725993	\N
97	FK202603295739		other	劳务费	400.00	2025-10-12	9	乌日力格	仓库货品点数	1	2026-03-29 15:38:18.608155	\N
98	FK202603298495		other	其他支出	18000.00	2025-10-09	8	孟根		1	2026-03-29 15:38:19.526667	\N
\.


--
-- Data for Name: prepay_record; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.prepay_record (id, order_sn, pay_type, supplier_id, supplier_name, customer_id, customer_name, amount, pay_date, fund_id, fund_name, admin_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: procure_inhouse; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_inhouse (id, order_no, purchase_order_id, supplier_id, supplier_name, admin_name, in_date, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: procure_plan; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_plan (id, order_no, plan_date, goods_info, remark, status, admin_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: procure_return; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_return (id, order_no, order_sn, order_id, supplier_id, supplier_name, admin_name, return_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: purchase_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_order (id, order_no, order_sn, supplier_id, supplier_name, admin_name, order_date, total_amount, pay_amount, freight_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, fund_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: retail_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_members (id, name, mobile, gender, birthday, balance, points, level, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: retail_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_orders (id, order_sn, member_id, member_name, goods_info, total_amount, pay_amount, pay_type, order_date, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: retail_recharge; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_recharge (id, recharge_no, member_id, member_name, amount, fund_id, fund_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, permissions, status, created_at) FROM stdin;
\.


--
-- Data for Name: sale_contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_contracts (id, order_no, order_sn, customer_id, customer_name, admin_name, order_date, total_amount, pay_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_customers (id, name, nickname, code, mobile, tel, email, address, contact, level_name, source_name, level_id, source_id, follow_admin_id, follow_admin, balance, is_sea, remark, status, create_time, update_time, deleted_at) FROM stdin;
1	奈日青城咖啡/玉泉区	奈日青城咖啡/玉泉区							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:07.248506	2026-03-29 08:15:07.248506	\N
2	放牛娃/呼伦贝尔	放牛娃/呼伦贝尔							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:07.697787	2026-03-29 08:15:07.697787	\N
3	阿润诺尔	阿润诺尔							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:08.158673	2026-03-29 08:15:08.158673	\N
4	乌海城市文化传媒有限公司	乌海城市文化传媒有限公司							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:08.637813	2026-03-29 08:15:08.637813	\N
5	蒙优农品	蒙优农品							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:09.086682	2026-03-29 08:15:09.086682	\N
6	一件代发客户	一件代发客户							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:09.566793	2026-03-29 08:15:09.566793	\N
7	电商/抖音专用	电商/抖音专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:10.018866	2026-03-29 08:15:10.018866	\N
8	电商/淘宝专用	电商/淘宝专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:10.545409	2026-03-29 08:15:10.545409	\N
9	线下/美团专用	线下/美团专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:11.016352	2026-03-29 08:15:11.016352	\N
10	电商/微信小店	电商/微信小店							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:11.475144	2026-03-29 08:15:11.475144	\N
11	电商/小红书	电商/小红书							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:11.96259	2026-03-29 08:15:11.96259	\N
12	电商/拼多多	电商/拼多多							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:12.393471	2026-03-29 08:15:12.393471	\N
13	五洲四海	五洲四海							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:12.876992	2026-03-29 08:15:12.876992	\N
14	零售/散单/点这个	零售/散单/点这个							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:13.300079	2026-03-29 08:15:13.300079	\N
15	线下店铺/零售专用	线下店铺/零售专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:13.85502	2026-03-29 08:15:13.85502	\N
16	样品专用客户	样品专用客户							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:14.339846	2026-03-29 08:15:14.339846	\N
17	呼市扎那家	呼市扎那家							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:14.80841	2026-03-29 08:15:14.80841	\N
18	鄂尔多斯游牧大市集	鄂尔多斯游牧大市集							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:15.296539	2026-03-29 08:15:15.296539	\N
19	呼市武小满咖啡研究所	呼市武小满咖啡研究所							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:15.740771	2026-03-29 08:15:15.740771	\N
20	呼市蒙古商城唐斯格乳制品	呼市蒙古商城唐斯格乳制品							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:16.299177	2026-03-29 08:15:16.299177	\N
21	阿斯娜	阿斯娜							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:16.741966	2026-03-29 08:15:16.741966	\N
\.


--
-- Data for Name: sale_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_offers (id, order_no, customer_id, customer_name, admin_name, offer_date, total_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_out_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_out_order (id, order_no, order_sn, customer_id, customer_name, admin_name, out_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_return_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_return_order (id, order_no, customer_id, customer_name, return_date, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff (id, name, code, mobile, email, dept_id, dept_name, job_id, job_name, entry_date, gender, status, remark, created_at) FROM stdin;
\.


--
-- Data for Name: stock_checks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_checks (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, admin_name, created_at) FROM stdin;
\.


--
-- Data for Name: stock_flow; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_flow (id, goods_id, goods_name, warehouse_id, warehouse_name, type, qty, before_qty, after_qty, order_no, remark, created_at) FROM stdin;
\.


--
-- Data for Name: stock_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_inventory (id, goods_id, goods_name, goods_code, unit_name, warehouse_id, warehouse_name, qty, cost, update_time) FROM stdin;
\.


--
-- Data for Name: stock_other_in; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_in (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: stock_other_out; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_out (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: supplier; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.supplier (id, name, contact, mobile, email, address, bank, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
0	纯净	1							1	2026-03-29 15:42:32.952504	2026-03-29 15:42:32.952504	\N
73	测试供应商_验证序列	测试							1	2026-03-29 16:43:10.24851	2026-03-29 16:43:10.24851	2026-03-29 16:43:11.932854
\.


--
-- Data for Name: sys_params; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sys_params (id, key, value, remark) FROM stdin;
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.warehouses (id, name, address, remark, status, create_time) FROM stdin;
1	默认仓库			1	2026-03-28 12:40:01.297668
2	默认仓库			1	2026-03-28 13:04:00.311975
3	默认仓库			1	2026-03-28 15:27:33.970328
4	默认仓库			1	2026-03-28 15:55:43.449274
5	默认仓库			1	2026-03-28 16:38:38.690211
6	默认仓库			1	2026-03-28 16:44:50.600007
7	默认仓库			1	2026-03-28 17:11:35.050357
8	默认仓库			1	2026-03-28 17:22:12.560913
9	默认仓库			1	2026-03-28 22:07:54.762114
10	默认仓库			1	2026-03-29 05:06:32.176456
11	默认仓库			1	2026-03-29 05:18:24.494693
12	默认仓库			1	2026-03-29 05:38:36.485287
13	默认仓库			1	2026-03-29 05:45:52.801868
14	默认仓库			1	2026-03-29 05:55:11.677437
15	默认仓库			1	2026-03-29 06:42:11.610646
16	默认仓库			1	2026-03-29 07:23:22.393738
17	默认仓库			1	2026-03-29 07:56:04.766849
18	默认仓库			1	2026-03-29 08:03:45.6008
19	默认仓库			1	2026-03-29 08:22:52.402644
20	默认仓库			1	2026-03-29 10:00:07.834443
21	默认仓库			1	2026-03-29 10:32:12.209891
22	默认仓库			1	2026-03-29 11:22:04.999934
23	默认仓库			1	2026-03-29 11:46:33.972221
24	默认仓库			1	2026-03-29 12:49:05.812735
25	默认仓库			1	2026-03-29 13:31:35.325303
26	默认仓库			1	2026-03-29 13:59:29.671422
27	默认仓库			1	2026-03-29 15:02:42.012659
28	默认仓库			1	2026-03-29 15:35:46.471511
29	默认仓库			1	2026-03-29 16:43:02.133764
30	默认仓库			1	2026-03-29 16:58:30.061243
31	默认仓库			1	2026-03-29 17:41:56.45484
32	默认仓库			1	2026-03-29 18:04:48.644347
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admins_id_seq', 104, true);


--
-- Name: collect_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.collect_receipt_id_seq', 25, true);


--
-- Name: company_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.company_info_id_seq', 1, true);


--
-- Name: depts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.depts_id_seq', 50, true);


--
-- Name: finance_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_costs_id_seq', 50, true);


--
-- Name: finance_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_expenses_id_seq', 50, true);


--
-- Name: finance_funds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_funds_id_seq', 16, true);


--
-- Name: finance_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_invoices_id_seq', 50, true);


--
-- Name: finance_payable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_payable_id_seq', 50, true);


--
-- Name: finance_receivable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_receivable_id_seq', 50, true);


--
-- Name: finance_statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_statements_id_seq', 50, true);


--
-- Name: goods_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_brand_id_seq', 50, true);


--
-- Name: goods_cate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_cate_id_seq', 420, true);


--
-- Name: goods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_id_seq', 3079, true);


--
-- Name: goods_spec_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_spec_id_seq', 200, true);


--
-- Name: goods_unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_unit_id_seq', 50, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.jobs_id_seq', 50, true);


--
-- Name: operation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.operation_logs_id_seq', 1000, true);


--
-- Name: pay_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pay_receipt_id_seq', 98, true);


--
-- Name: prepay_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.prepay_record_id_seq', 50, true);


--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_inhouse_id_seq', 50, true);


--
-- Name: procure_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_plan_id_seq', 50, true);


--
-- Name: procure_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_return_id_seq', 50, true);


--
-- Name: purchase_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_order_id_seq', 33, true);


--
-- Name: retail_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_members_id_seq', 10, true);


--
-- Name: retail_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_orders_id_seq', 20, true);


--
-- Name: retail_recharge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_recharge_id_seq', 20, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 10, true);


--
-- Name: sale_contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_contracts_id_seq', 100, true);


--
-- Name: sale_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_customers_id_seq', 54, true);


--
-- Name: sale_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_offers_id_seq', 50, true);


--
-- Name: sale_out_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_out_order_id_seq', 100, true);


--
-- Name: sale_return_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_return_order_id_seq', 50, true);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_id_seq', 20, true);


--
-- Name: stock_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_checks_id_seq', 50, true);


--
-- Name: stock_flow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_flow_id_seq', 100, true);


--
-- Name: stock_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_inventory_id_seq', 50, true);


--
-- Name: stock_other_in_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_in_id_seq', 50, true);


--
-- Name: stock_other_out_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_out_id_seq', 50, true);


--
-- Name: supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.supplier_id_seq', 73, true);


--
-- Name: sys_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sys_params_id_seq', 50, true);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 32, true);


--
-- Name: admins admins_account_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_account_key UNIQUE (account);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: collect_receipt collect_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt
    ADD CONSTRAINT collect_receipt_pkey PRIMARY KEY (id);


--
-- Name: company_info company_info_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info
    ADD CONSTRAINT company_info_pkey PRIMARY KEY (id);


--
-- Name: depts depts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts
    ADD CONSTRAINT depts_pkey PRIMARY KEY (id);


--
-- Name: finance_costs finance_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs
    ADD CONSTRAINT finance_costs_pkey PRIMARY KEY (id);


--
-- Name: finance_expenses finance_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses
    ADD CONSTRAINT finance_expenses_pkey PRIMARY KEY (id);


--
-- Name: finance_funds finance_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds
    ADD CONSTRAINT finance_funds_pkey PRIMARY KEY (id);


--
-- Name: finance_invoices finance_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices
    ADD CONSTRAINT finance_invoices_pkey PRIMARY KEY (id);


--
-- Name: finance_payable finance_payable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable
    ADD CONSTRAINT finance_payable_pkey PRIMARY KEY (id);


--
-- Name: finance_receivable finance_receivable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable
    ADD CONSTRAINT finance_receivable_pkey PRIMARY KEY (id);


--
-- Name: finance_statements finance_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements
    ADD CONSTRAINT finance_statements_pkey PRIMARY KEY (id);


--
-- Name: goods_brand goods_brand_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand
    ADD CONSTRAINT goods_brand_pkey PRIMARY KEY (id);


--
-- Name: goods_cate goods_cate_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate
    ADD CONSTRAINT goods_cate_pkey PRIMARY KEY (id);


--
-- Name: goods goods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods
    ADD CONSTRAINT goods_pkey PRIMARY KEY (id);


--
-- Name: goods_spec goods_spec_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec
    ADD CONSTRAINT goods_spec_pkey PRIMARY KEY (id);


--
-- Name: goods_unit goods_unit_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit
    ADD CONSTRAINT goods_unit_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: operation_logs operation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs
    ADD CONSTRAINT operation_logs_pkey PRIMARY KEY (id);


--
-- Name: pay_receipt pay_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt
    ADD CONSTRAINT pay_receipt_pkey PRIMARY KEY (id);


--
-- Name: prepay_record prepay_record_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record
    ADD CONSTRAINT prepay_record_pkey PRIMARY KEY (id);


--
-- Name: procure_inhouse procure_inhouse_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse
    ADD CONSTRAINT procure_inhouse_pkey PRIMARY KEY (id);


--
-- Name: procure_plan procure_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan
    ADD CONSTRAINT procure_plan_pkey PRIMARY KEY (id);


--
-- Name: procure_return procure_return_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return
    ADD CONSTRAINT procure_return_pkey PRIMARY KEY (id);


--
-- Name: purchase_order purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_pkey PRIMARY KEY (id);


--
-- Name: retail_members retail_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members
    ADD CONSTRAINT retail_members_pkey PRIMARY KEY (id);


--
-- Name: retail_orders retail_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders
    ADD CONSTRAINT retail_orders_pkey PRIMARY KEY (id);


--
-- Name: retail_recharge retail_recharge_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge
    ADD CONSTRAINT retail_recharge_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_contracts sale_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts
    ADD CONSTRAINT sale_contracts_pkey PRIMARY KEY (id);


--
-- Name: sale_customers sale_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers
    ADD CONSTRAINT sale_customers_pkey PRIMARY KEY (id);


--
-- Name: sale_offers sale_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers
    ADD CONSTRAINT sale_offers_pkey PRIMARY KEY (id);


--
-- Name: sale_out_order sale_out_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order
    ADD CONSTRAINT sale_out_order_pkey PRIMARY KEY (id);


--
-- Name: sale_return_order sale_return_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order
    ADD CONSTRAINT sale_return_order_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: stock_checks stock_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks
    ADD CONSTRAINT stock_checks_pkey PRIMARY KEY (id);


--
-- Name: stock_flow stock_flow_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow
    ADD CONSTRAINT stock_flow_pkey PRIMARY KEY (id);


--
-- Name: stock_inventory stock_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory
    ADD CONSTRAINT stock_inventory_pkey PRIMARY KEY (id);


--
-- Name: stock_other_in stock_other_in_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in
    ADD CONSTRAINT stock_other_in_pkey PRIMARY KEY (id);


--
-- Name: stock_other_out stock_other_out_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out
    ADD CONSTRAINT stock_other_out_pkey PRIMARY KEY (id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- Name: sys_params sys_params_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_key_key UNIQUE (key);


--
-- Name: sys_params sys_params_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict T6UQFyQuKvKhfCmFIt6ZcfMNKOsoYRlsIhA5ThPaPHVgrGne7kTmBMh2Ui42ezW

